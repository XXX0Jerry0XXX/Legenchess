import unittest
import numpy as np
import torch

from ppo import Engine, Policy, collate, gae, unpack


class PPOTests(unittest.TestCase):
    def test_same_player_gae_and_terminal_reset(self):
        rewards = np.asarray([[0.0], [1.0]], dtype=np.float32)
        values = np.asarray([[0.2], [0.4]], dtype=np.float32)
        done = np.asarray([[0.0], [1.0]], dtype=np.float32)
        _, returns = gae(rewards, values, done, np.asarray([999]), 0.9, 1.0)
        np.testing.assert_allclose(returns[:, 0], [0.9, 1.0], atol=1e-6)

    def test_truncation_bootstrap_does_not_use_next_episode(self):
        # A time limit continues from V(final)=0.3, not V(the autoreset)=999.
        _, returns = gae(np.asarray([[0.5 + 0.9 * 0.3]], dtype=np.float32),
            np.asarray([[0.1]], dtype=np.float32), np.asarray([[1.0]], dtype=np.float32),
            np.asarray([999]), 0.9, 0.95)
        np.testing.assert_allclose(returns[0], [0.77], atol=1e-6)

    def test_mask_and_piece_order_invariance(self):
        torch.manual_seed(7)
        model = Policy()
        obs = torch.randn(2, 592)
        obs[1] = obs[0]
        pieces = obs[1, 16:].reshape(2, 16, 18)
        pieces[:] = pieces[:, torch.arange(15, -1, -1)].clone()
        candidates = torch.randn(2, 3, 96)
        candidates[1] = candidates[0]
        mask = torch.tensor([[True, True, False], [True, True, False]])
        dist, value = model(obs, candidates, mask)
        self.assertEqual(dist.probs[0, 2].item(), 0)
        torch.testing.assert_close(dist.logits[0], dist.logits[1])
        torch.testing.assert_close(value[0], value[1])

    def test_exported_javascript_policy_matches_pytorch(self):
        torch.manual_seed(31)
        model = Policy()
        with Engine() as engine:
            data = engine.request("init", numEnvs=2, seed=71, opponent="random", skirmishProbability=0)
            observations = [unpack(o) for o in data["observations"]]
            obs, candidates, mask = collate(observations, "cpu")
            with torch.no_grad():
                context = model.encode(obs)
                scores = model.actor(candidates).squeeze(-1) + (torch.tanh(model.candidate(candidates)) * context[:, None, :]).sum(-1) / (32 ** 0.5)
                values = model.values(obs)
            reference = engine.request("scores", policy=model.export())
            for i, item in enumerate(reference):
                np.testing.assert_allclose(item["scores"], scores[i, :len(item["scores"])].numpy(), atol=2e-6)
                self.assertAlmostEqual(item["value"], values[i].item(), places=5)


if __name__ == "__main__":
    torch.set_num_threads(2)
    unittest.main()
