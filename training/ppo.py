"""Clipped PPO over complete legal decisions, using the actual TypeScript game.

No imitation targets or heuristic policy logits are used by the learner. The
candidate scorer handles a variable number of legal decisions; padding is masked.
"""
from __future__ import annotations

import argparse
import base64
import csv
import json
import math
import random
import subprocess
import time
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import torch
from torch import nn
from torch.distributions import Categorical

REPO = Path(__file__).resolve().parents[1]
RULES_VERSION = "legenchess-8x12-ppo-v1"
GLOBAL_DIM, PIECE_DIM, OBS_DIM, ACTION_DIM, SCALE = 16, 18, 592, 96, 1024


@dataclass
class Observation:
    obs: np.ndarray
    candidates: np.ndarray


def decode(data: str) -> np.ndarray:
    return np.frombuffer(base64.b64decode(data), dtype="<i2")


def unpack(data) -> Observation | None:
    if data is None:
        return None
    obs = decode(data["obs"])
    candidates = decode(data["candidates"]).reshape(data["count"], ACTION_DIM)
    if obs.size != OBS_DIM or candidates.shape[0] == 0:
        raise RuntimeError("Invalid observation from TypeScript engine")
    return Observation(obs, candidates)


class Engine:
    def __init__(self):
        script = REPO / "program/.rl/rl-server.mjs"
        if not script.exists():
            subprocess.run(["npm", "run", "rl:build"], cwd=REPO / "program", check=True)
        self.process = subprocess.Popen(
            ["node", str(script)], cwd=REPO, stdin=subprocess.PIPE,
            stdout=subprocess.PIPE, text=True, encoding="utf-8", bufsize=1,
        )

    def request(self, command: str, **kwargs):
        self.process.stdin.write(json.dumps({"command": command, **kwargs}, separators=(",", ":")) + "\n")
        self.process.stdin.flush()
        line = self.process.stdout.readline()
        if not line:
            raise RuntimeError(f"Game engine exited: {self.process.poll()}")
        result = json.loads(line)
        if isinstance(result, dict) and "error" in result:
            raise RuntimeError(result.get("stack", result["error"]))
        return result

    def close(self):
        if self.process.poll() is None:
            self.process.stdin.close()
            try:
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.process.terminate()
                self.process.wait(timeout=5)
        self.process.stdout.close()

    def __enter__(self):
        return self

    def __exit__(self, *_):
        self.close()


class Policy(nn.Module):
    def __init__(self):
        super().__init__()
        self.piece1, self.piece2 = nn.Linear(PIECE_DIM, 32), nn.Linear(32, 32)
        self.state1, self.state2 = nn.Linear(GLOBAL_DIM + 128, 64), nn.Linear(64, 32)
        self.candidate = nn.Linear(ACTION_DIM, 32)
        self.actor, self.value = nn.Linear(ACTION_DIM, 1), nn.Linear(32, 1)
        for module in self.modules():
            if isinstance(module, nn.Linear):
                nn.init.orthogonal_(module.weight, math.sqrt(2))
                nn.init.zeros_(module.bias)
        nn.init.orthogonal_(self.actor.weight, 0.01)
        nn.init.orthogonal_(self.candidate.weight, 0.01)
        nn.init.orthogonal_(self.value.weight, 1.0)

    def encode(self, obs):
        pieces = obs[:, GLOBAL_DIM:].reshape(-1, 2, 16, PIECE_DIM)
        hidden = torch.tanh(self.piece2(torch.tanh(self.piece1(pieces))))
        pooled = torch.cat([hidden.mean(dim=2), hidden.amax(dim=2)], dim=-1).reshape(-1, 128)
        return torch.tanh(self.state2(torch.tanh(self.state1(torch.cat([obs[:, :GLOBAL_DIM], pooled], dim=-1)))))

    def values(self, obs):
        return self.value(self.encode(obs)).squeeze(-1)

    def forward(self, obs, candidates, mask):
        context = self.encode(obs)
        hidden = torch.tanh(self.candidate(candidates))
        logits = self.actor(candidates).squeeze(-1) + (hidden * context[:, None, :]).sum(-1) / math.sqrt(32)
        return Categorical(logits=logits.masked_fill(~mask, -1e9)), self.value(context).squeeze(-1)

    def export(self, steps=0):
        return {"rulesVersion": RULES_VERSION, "observationSize": OBS_DIM, "candidateFeatures": ACTION_DIM,
                "steps": steps, "layers": {name: {"weight": module.weight.detach().cpu().tolist(),
                "bias": module.bias.detach().cpu().tolist()} for name, module in self.named_children()}}


def collate(observations: list[Observation], device):
    obs = np.stack([o.obs for o in observations])
    width = max(o.candidates.shape[0] for o in observations)
    candidates = np.zeros((len(observations), width, ACTION_DIM), dtype=np.int16)
    mask = np.zeros((len(observations), width), dtype=bool)
    for i, item in enumerate(observations):
        count = item.candidates.shape[0]
        candidates[i, :count] = item.candidates
        mask[i, :count] = True
    return (torch.as_tensor(obs, device=device, dtype=torch.float32) / SCALE,
            torch.as_tensor(candidates, device=device, dtype=torch.float32) / SCALE,
            torch.as_tensor(mask, device=device))


def observation_tensor(observations, device):
    return torch.as_tensor(np.stack(observations), device=device, dtype=torch.float32) / SCALE


def gae(rewards, values, dones, last_values, gamma, lam):
    """Dones include truncation; its value bootstrap is already added to reward."""
    advantages = np.zeros_like(rewards)
    carry = np.zeros(rewards.shape[1], dtype=np.float32)
    for t in range(rewards.shape[0] - 1, -1, -1):
        next_value = last_values if t == rewards.shape[0] - 1 else values[t + 1]
        continuation = 1.0 - dones[t]
        delta = rewards[t] + gamma * next_value * continuation - values[t]
        carry = delta + gamma * lam * continuation * carry
        advantages[t] = carry
    return advantages, advantages + values


def optimize(model, optimizer, states, actions, old_logs, old_values, advantages, returns, args, rng, device):
    advantages = (advantages - advantages.mean()) / (advantages.std() + 1e-8)
    rows = []
    stop = False
    for _ in range(args.epochs):
        order = rng.permutation(len(states))
        for start in range(0, len(order), args.batch_size):
            indices = order[start:start + args.batch_size]
            obs, candidates, mask = collate([states[i] for i in indices], device)
            dist, value = model(obs, candidates, mask)
            action = torch.as_tensor(actions[indices], device=device)
            old_log = torch.as_tensor(old_logs[indices], device=device)
            adv = torch.as_tensor(advantages[indices], device=device)
            target = torch.as_tensor(returns[indices], device=device)
            previous = torch.as_tensor(old_values[indices], device=device)
            log_ratio = dist.log_prob(action) - old_log
            ratio = log_ratio.exp()
            policy_loss = torch.maximum(-ratio * adv, -ratio.clamp(1 - args.clip, 1 + args.clip) * adv).mean()
            clipped_value = previous + (value - previous).clamp(-args.clip, args.clip)
            value_loss = 0.5 * torch.maximum((value - target).square(), (clipped_value - target).square()).mean()
            entropy = (dist.entropy() / mask.sum(-1).float().log().clamp_min(1)).mean()
            loss = policy_loss + 0.5 * value_loss - args.entropy * entropy
            if not torch.isfinite(loss):
                raise RuntimeError("Non-finite PPO loss")
            optimizer.zero_grad(set_to_none=True)
            loss.backward()
            norm = nn.utils.clip_grad_norm_(model.parameters(), 0.5)
            if not torch.isfinite(norm):
                raise RuntimeError("Non-finite policy gradients")
            optimizer.step()
            with torch.no_grad():
                kl = ((ratio - 1) - log_ratio).mean().item()
                clip_fraction = ((ratio - 1).abs() > args.clip).float().mean().item()
            rows.append([policy_loss.item(), value_loss.item(), entropy.item(), kl, clip_fraction, norm.item()])
            if kl > args.target_kl:
                stop = True
                break
        if stop:
            break
    values = np.asarray(rows).mean(axis=0)
    return dict(zip(["policy_loss", "value_loss", "normalized_entropy", "approx_kl", "clip_fraction", "gradient_norm"], map(float, values)))


def checkpoint(model, optimizer, args, steps, updates, output, rng):
    payload = {"rules_version": RULES_VERSION, "model": model.state_dict(), "optimizer": optimizer.state_dict(),
               "steps": steps, "updates": updates, "arguments": vars(args), "torch_rng": torch.get_rng_state(),
               "numpy_rng": rng.bit_generator.state, "torch_version": str(torch.__version__)}
    if torch.cuda.is_available():
        payload["cuda_rng"] = torch.cuda.get_rng_state_all()
    temporary = output / "checkpoint.tmp"
    torch.save(payload, temporary)
    temporary.replace(output / "latest.pt")
    (output / "policy.json").write_text(json.dumps(model.export(steps), separators=(",", ":")), encoding="utf-8")


def train(args, model, optimizer, device):
    output = Path(args.output).resolve()
    output.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(args.seed)
    steps = updates = 0
    if args.resume:
        saved = torch.load(args.resume, map_location=device, weights_only=False)
        if saved["rules_version"] != RULES_VERSION:
            raise ValueError("Checkpoint rules mismatch")
        model.load_state_dict(saved["model"])
        optimizer.load_state_dict(saved["optimizer"])
        steps, updates = saved["steps"], saved["updates"]
        rng.bit_generator.state = saved["numpy_rng"]
        torch.set_rng_state(saved["torch_rng"].cpu())
        if "cuda_rng" in saved and torch.cuda.is_available():
            torch.cuda.set_rng_state_all([s.cpu() for s in saved["cuda_rng"]])
    else:
        torch.save({"rules_version": RULES_VERSION, "model": model.state_dict(), "steps": 0}, output / "initial.pt")
        (output / "initial-policy.json").write_text(json.dumps(model.export(), separators=(",", ":")), encoding="utf-8")
    metadata = {"device": str(device), "gpu": torch.cuda.get_device_name(0) if device.type == "cuda" else None,
                "torch": str(torch.__version__), "numpy": np.__version__, "parameters": sum(p.numel() for p in model.parameters()),
                "rulesVersion": RULES_VERSION, "args": vars(args)}
    (output / "run-config.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(json.dumps({"event": "start", **metadata}), flush=True)
    start = time.monotonic()
    games = []
    with Engine() as engine:
        initial = engine.request("init", numEnvs=args.num_envs, seed=args.seed + steps * 17, paired=False,
            opponent=args.opponent, skirmishProbability=args.skirmish if steps < args.warmup_steps else args.final_skirmish,
            secondsPerDecision=args.seconds_per_decision, maxDecisions=args.max_decisions, gamma=args.gamma, shaping=args.shaping)
        if initial["rulesVersion"] != RULES_VERSION:
            raise RuntimeError("Rule version mismatch")
        current = [unpack(o) for o in initial["observations"]]
        if args.resume:
            engine.request("opponent", policy=model.export(steps))
        try:
            metrics_path = output / "metrics.csv"
            append_metrics = bool(args.resume and metrics_path.exists() and metrics_path.stat().st_size)
            with metrics_path.open("a" if append_metrics else "w", newline="", encoding="utf-8") as metric_file:
                writer = None
                while steps < args.steps and time.monotonic() - start < args.max_seconds:
                    states, actions, log_probs = [], [], []
                    values, rewards, dones = [], [], []
                    for _ in range(args.horizon):
                        with torch.no_grad():
                            dist, value = model(*collate(current, device))
                            action = dist.sample()
                            log_prob = dist.log_prob(action)
                        states.extend(current)
                        action_np = action.cpu().numpy()
                        actions.append(action_np)
                        log_probs.append(log_prob.cpu().numpy())
                        values.append(value.cpu().numpy())
                        response = engine.request("step", actions=action_np.tolist())
                        result = response["results"]
                        reward = np.asarray([r["reward"] for r in result], dtype=np.float32)
                        done = np.asarray([r["terminated"] or r["truncated"] for r in result], dtype=np.float32)
                        truncated = [i for i, r in enumerate(result) if r["truncated"]]
                        if truncated:
                            final_obs = observation_tensor([decode(result[i]["finalObservation"]) for i in truncated], device)
                            with torch.no_grad():
                                bootstraps = model.values(final_obs).cpu().numpy()
                            reward[truncated] += args.gamma * bootstraps
                        rewards.append(reward)
                        dones.append(done)
                        for r in result:
                            if r["terminated"] or r["truncated"]:
                                games.append({**r["info"], "truncated": r["truncated"], "at_step": steps + len(actions) * args.num_envs})
                        current = [unpack(o) for o in response["observations"]]
                    with torch.no_grad():
                        last = model.values(observation_tensor([o.obs for o in current], device)).cpu().numpy()
                    v, r, d = np.stack(values), np.stack(rewards), np.stack(dones)
                    advantages, returns = gae(r, v, d, last, args.gamma, args.gae_lambda)
                    stats = optimize(model, optimizer, states, np.stack(actions).ravel(), np.stack(log_probs).ravel(),
                        v.ravel(), advantages.ravel(), returns.ravel(), args, rng, device)
                    steps += args.horizon * args.num_envs
                    updates += 1
                    recent = games[-100:]
                    row = {"steps": steps, "updates": updates, "elapsed_seconds": round(time.monotonic() - start, 2),
                           "decisions_per_second": round((steps - (saved["steps"] if args.resume else 0)) / (time.monotonic() - start), 2),
                           "completed_games": len(games), "recent_outcome": float(np.mean([g["outcome"] for g in recent])) if recent else 0,
                           "recent_truncation_rate": float(np.mean([g["truncated"] for g in recent])) if recent else 0,
                           "mean_reward": float(r.mean()), **stats}
                    if writer is None:
                        writer = csv.DictWriter(metric_file, fieldnames=list(row))
                        if not append_metrics:
                            writer.writeheader()
                    writer.writerow(row)
                    metric_file.flush()
                    print(json.dumps(row), flush=True)
                    if steps >= args.warmup_steps:
                        engine.request("configure", skirmishProbability=args.final_skirmish)
                    if updates % args.snapshot_every == 0:
                        policy = model.export(steps)
                        engine.request("opponent", policy=policy)
                        (output / f"snapshot-{steps:09d}.json").write_text(json.dumps(policy, separators=(",", ":")), encoding="utf-8")
                    if updates % args.save_every == 0:
                        checkpoint(model, optimizer, args, steps, updates, output, rng)
        except KeyboardInterrupt:
            print(json.dumps({"event": "interrupted", "steps": steps}), flush=True)
        finally:
            checkpoint(model, optimizer, args, steps, updates, output, rng)
            with (output / "training-games.jsonl").open("a" if args.resume else "w", encoding="utf-8") as file:
                for game in games:
                    file.write(json.dumps(game) + "\n")
    print(json.dumps({"event": "finished", "steps": steps, "updates": updates, "seconds": time.monotonic() - start,
                      "checkpoint": str(output / "latest.pt")}), flush=True)


def wilson(wins, total):
    if total == 0:
        return [0, 1]
    z = 1.96
    p = wins / total
    denominator = 1 + z * z / total
    center = (p + z * z / (2 * total)) / denominator
    half = z * math.sqrt(p * (1 - p) / total + z * z / (4 * total * total)) / denominator
    return [center - half, center + half]


def evaluate(args, model, device):
    saved = torch.load(args.evaluate, map_location=device, weights_only=False)
    if saved["rules_version"] != RULES_VERSION:
        raise RuntimeError("Checkpoint version mismatch")
    model.load_state_dict(saved["model"])
    model.eval()
    summaries = []
    all_records = []
    with Engine() as engine:
        for opponent in args.eval_opponents.split(","):
            records = []
            start = time.monotonic()
            for base in range(0, args.games, args.num_envs):
                count = min(args.num_envs, args.games - base)
                initial = engine.request("init", numEnvs=count, seed=args.eval_seed + base // 2, paired=True, autoReset=False,
                    opponent=opponent, skirmishProbability=0, secondsPerDecision=args.seconds_per_decision,
                    maxDecisions=args.max_decisions, shaping=0)
                current = [unpack(o) for o in initial["observations"]]
                while any(o is not None for o in current):
                    active = [i for i, o in enumerate(current) if o is not None]
                    with torch.no_grad():
                        dist, _ = model(*collate([current[i] for i in active], device))
                        choices = dist.logits.argmax(-1) if not args.stochastic else dist.sample()
                    actions = [-1] * count
                    for i, action in zip(active, choices.cpu().tolist()):
                        actions[i] = action
                    response = engine.request("step", actions=actions)
                    for r in response["results"]:
                        if r and (r["terminated"] or r["truncated"]):
                            records.append({**r["info"], "truncated": r["truncated"]})
                    current = [unpack(o) for o in response["observations"]]
                print(json.dumps({"event": "evaluation_progress", "opponent": opponent, "games": len(records)}), flush=True)
            completed = [r for r in records if not r["truncated"]]
            wins = sum(r["outcome"] == 1 for r in completed)
            losses = sum(r["outcome"] == -1 for r in completed)
            draws = sum(r["outcome"] == 0 for r in completed)
            summary = {"opponent": opponent, "games": len(records), "wins": wins, "losses": losses, "draws": draws,
                       "truncated": len(records) - len(completed), "completion_rate": len(completed) / len(records),
                       "score": (wins + 0.5 * draws) / len(completed) if completed else None,
                       "win_rate": wins / len(completed) if completed else None,
                       "win_rate_wilson95": wilson(wins, len(completed)),
                       "mean_decisions": float(np.mean([r["decisions"] for r in records])),
                       "baseline_fallbacks": sum(r["baselineFallbacks"] for r in records),
                       "seconds": round(time.monotonic() - start, 2)}
            summaries.append(summary)
            all_records.extend(records)
            print(json.dumps(summary), flush=True)
    output = Path(args.output).resolve()
    output.mkdir(parents=True, exist_ok=True)
    name = Path(args.evaluate).stem
    report = {"checkpoint": str(Path(args.evaluate).resolve()), "steps": saved["steps"], "rulesVersion": RULES_VERSION,
              "seed": args.eval_seed, "secondsPerDecision": args.seconds_per_decision, "maxDecisions": args.max_decisions,
              "fullBoardOnly": True, "pairedSides": True, "stochastic": args.stochastic, "summaries": summaries, "games": all_records}
    (output / f"evaluation-{name}.json").write_text(json.dumps(report, indent=2), encoding="utf-8")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="training/runs/ppo")
    parser.add_argument("--steps", type=int, default=131072, help="Total target learner decisions, including resumed steps")
    parser.add_argument("--num-envs", type=int, default=16)
    parser.add_argument("--horizon", type=int, default=128)
    parser.add_argument("--epochs", type=int, default=4)
    parser.add_argument("--batch-size", type=int, default=128)
    parser.add_argument("--seed", type=int, default=20261030)
    parser.add_argument("--gamma", type=float, default=0.995)
    parser.add_argument("--gae-lambda", type=float, default=0.95)
    parser.add_argument("--clip", type=float, default=0.2)
    parser.add_argument("--entropy", type=float, default=0.005)
    parser.add_argument("--target-kl", type=float, default=0.04)
    parser.add_argument("--lr", type=float, default=3e-4)
    parser.add_argument("--opponent", choices=["mixed", "random", "beginner", "expert", "tactical"], default="mixed")
    parser.add_argument("--skirmish", type=float, default=1.0)
    parser.add_argument("--warmup-steps", type=int, default=32768)
    parser.add_argument("--final-skirmish", type=float, default=0.25)
    parser.add_argument("--seconds-per-decision", type=int, default=10, help="Virtual seconds charged per complete decision; 0 = untimed")
    parser.add_argument("--max-decisions", type=int, default=1024)
    parser.add_argument("--shaping", type=float, default=0.2)
    parser.add_argument("--snapshot-every", type=int, default=8)
    parser.add_argument("--save-every", type=int, default=4)
    parser.add_argument("--max-seconds", type=int, default=1200)
    parser.add_argument("--resume")
    parser.add_argument("--device", choices=["auto", "cpu", "cuda"], default="auto")
    parser.add_argument("--evaluate")
    parser.add_argument("--eval-opponents", default="beginner,expert,tactical")
    parser.add_argument("--games", type=int, default=200)
    parser.add_argument("--eval-seed", type=int, default=900000)
    parser.add_argument("--stochastic", action="store_true")
    args = parser.parse_args()
    if min(args.num_envs, args.horizon, args.batch_size, args.epochs, args.games) <= 0:
        parser.error("Batch sizes, horizon, epochs and game count must be positive")
    torch.set_num_threads(4)
    random.seed(args.seed)
    np.random.seed(args.seed)
    torch.manual_seed(args.seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(args.seed)
    device = torch.device("cuda" if args.device == "auto" and torch.cuda.is_available() else "cpu" if args.device == "auto" else args.device)
    model = Policy().to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=args.lr, eps=1e-5)
    if args.evaluate:
        evaluate(args, model, device)
    else:
        train(args, model, optimizer, device)


if __name__ == "__main__":
    main()
