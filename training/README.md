# PPO 训练与复现

训练器使用 PyTorch 的 clipped PPO，直接连接 TypeScript 游戏规则。网页包含独立的“PPO 实验版”选项；模型在 Web Worker 中运行，游玩不需要 Python 或推理服务器。

## 安装和启动

在仓库根目录创建 Python 3.11/3.12 环境：

```bash
python -m venv .venv
.venv/bin/python -m pip install -r training/requirements.txt
cd program
npm ci
npm run rl:build
cd ..
.venv/bin/python training/ppo.py --output training/runs/ppo --steps 131072
```

Windows 原生环境把 `.venv/bin/python` 换成 `.venv\Scripts\python.exe`。使用 NVIDIA RTX 50 系显卡时，先按对应系统安装支持该 GPU 的 CUDA 版 PyTorch；本次实际使用 `torch==2.7.1+cu128`：

```bash
.venv/bin/python -m pip install torch==2.7.1 --index-url https://download.pytorch.org/whl/cu128
.venv/bin/python -m pip install -r training/requirements.txt
```

训练会自动选 GPU，也可以显式传 `--device cpu`。默认 16 个环境、128 步 rollout、每轮 2048 个学习方完整决策、4 个优化 epoch。`--max-seconds 1200` 是默认的单次运行时间上限，达到步数或时间上限后保存检查点。

## 检查点和续训

输出包括 `latest.pt`（网络、优化器和随机状态）、`policy.json`（网页可用的权重）、`initial.pt`、`metrics.csv`、`training-games.jsonl` 和定期历史快照。

```bash
.venv/bin/python training/ppo.py --output training/runs/ppo \
  --resume training/runs/ppo/latest.pt --steps 262144
```

`--steps` 是包含已有训练在内的目标总步数。续训保留网络、优化器及 Python/NumPy/PyTorch 采样状态，但会重新创建在途棋局，并从当前网络重建初始快照池；它不承诺逐字节延续尚未完成的对局。修改游戏规则后要执行 `npm run rl:build`，并使用新的规则版本重新训练。

## 算法与动作

第一版使用一个 16,258 参数的集合编码网络：每枚棋子 18 个特征，经共享 MLP 编码后对双方各自做均值和最大值池化；加上 16 个全局特征，得到状态表示。这个表示不依赖棋子 ID 或槽位排列。

每项完整合法决策有 96 个特征，包含动作类型、源/目标位置、棋子属性、公开规则下可计算的伤害/反击、复活对象及免费次数。网络给每个候选打分，在候选之间计算分类分布。训练批次补齐的候选位置全部屏蔽，策略没有启发式预设分数，也没有模仿学习目标。

它支持普通移动/攻击、战士技能、法师所有 1～3 个目标组合、刺客发动与两种免费动作、牧师所有合法复活对象/落点、转职和提前结束回合。一次环境步是完整决策，选择按钮不计入训练步数。所有决策最终都通过网页使用的 reducer 结算。

PPO 使用 `clip=0.2`、`gamma=0.995`、`GAE lambda=0.95`、Adam `lr=3e-4`、梯度裁剪 0.5、目标 KL 0.04。学习方在每局固定，遇到对手回合由环境代为运行，因此 AP 连续行动不会导致价值视角错误翻转。终局奖励为胜 +1、负 −1、真实平局 0；另有系数 0.2 的有界子力势函数塑形。采样截断独立标记，并从最后的非终局状态 bootstrap。

训练从残局课程开始，32768 步后以 75% 完整开局、25% 残局采样。完整开局双方各 16 子；残局只是较少存活棋子的训练状态。历史快照出现后，混合对手约为 25% 快照、50% 确定规则的战术 AI、25% 随机合法策略；每局固定一个对手，快照最多保留 4 个。战术 AI 是新增训练基准，与游戏原有的 expert AI 分开命名。

## 时钟与评测

双方仍各有 1500 秒。训练和默认评测把每项完整决策视作消耗 10 秒虚拟思考时间，包括免费动作、转职和结束回合；时间耗尽按剩余棋子数量判胜。这个近似让对局可复现，成绩不能直接等同于真实人类思考速度下的 25 分钟比赛。网页仍使用真实时钟。

```bash
.venv/bin/python training/ppo.py --evaluate training/runs/ppo/latest.pt \
  --output training/runs/ppo --games 200 --eval-seed 900000 \
  --eval-opponents beginner,expert,tactical --device cpu
```

每个对手单独测 200 局，只用完整开局，100 组种子交换执棋方，种子与训练分开。默认使用贪心策略，与网页一致。报告胜负平、完成率、截断率和胜率置信区间；得分为 `(胜 + 0.5×真实平局) / 已完成局数`。未训练模型可以用 `initial.pt` 在相同种子上评测。加 `--seconds-per-decision 0` 可以测无计时版本；这时应关注独立的截断率。

游戏原有 expert AI 只看一步子力与 AP，常提前结束回合。评测不会把它的非法候选强行执行：若旧 AI 返回的序列不在合法决策中，则结束回合/完成转职，并单独记录 `baseline_fallbacks`。战胜它不能代替对战术基准和真人的测试。

## 网页权重

训练后把 `policy.json` 复制为 `program/public/models/ppo.json`，再运行网页构建：

```bash
cp training/runs/ppo/policy.json program/public/models/ppo.json
cd program
npm run build
```

网络较小，第一版用 JSON 权重和同构的 JavaScript MLP 推理，避免引入额外运行时；Python 与 JavaScript 的分数和值由测试逐项比较。模型校验规则版本、输入尺寸及层形状。推理放在 Worker 中，换局/换回合会丢弃旧结果；每秒的时钟更新不会取消正在加载的模型。失败时使用基础 AI 继续行动。

## 验证

```bash
cd program
npm test
npm run build
npm run rl:build
cd ..
.venv/bin/python -m unittest discover -s training -p 'test_*.py' -v
```

测试覆盖技能完整动作、反击与新手转职、免费动作跨回合清理、合法回放与固定种子、超时/截断、GAE 边界、候选掩码、棋子排列不变性，以及导出网络与 PyTorch 的数值一致性。

PPO 的优化目标参考[原始论文](https://arxiv.org/abs/1707.06347)和[PyTorch 官方 PPO 教程](https://docs.pytorch.org/tutorials/intermediate/reinforcement_ppo.html)。当前模型是首轮训练的实验版本；继续提升应依据独立评测，而不是训练曲线的单一奖励值。
