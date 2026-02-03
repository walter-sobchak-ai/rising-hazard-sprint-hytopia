export type RoundState = 'LOBBY' | 'COUNTDOWN' | 'RUNNING' | 'RESULTS';

export interface RoundDeps {
  hazards: { loadSchedule(): Promise<void>; start(seed: number): void; stop(): void };
  rewards: { grantRoundRewards(results: any[]): Promise<void> };
  quests: { progressFromRound(results: any[]): Promise<void> };
}

export class RoundStateMachine {
  private state: RoundState = 'LOBBY';
  private seed = 0;
  private roundDurationMs = 120_000;
  private minPlayers = 1;
  private players = new Set<string>();

  constructor(private deps: RoundDeps) {}

  async start() {
    await this.deps.hazards.loadSchedule();

    // TODO: replace with tick loop / scheduler from Hytopia.
    // For scaffold purposes, we just outline the flow.
    await this.loop();
  }

  onPlayerJoin(playerId: string) {
    this.players.add(playerId);
  }

  onPlayerLeave(playerId: string) {
    this.players.delete(playerId);
  }

  private async loop() {
    while (true) {
      await this.enterLobby();
      await this.enterCountdown(5_000);
      await this.enterRunning();
      const results = await this.enterResults();
      await this.deps.rewards.grantRoundRewards(results);
      await this.deps.quests.progressFromRound(results);

      // TODO: break condition / server shutdown handling.
    }
  }

  private async enterLobby() {
    this.state = 'LOBBY';
    // TODO: UI — show "Next round soon" + quests
    await this.waitUntil(() => this.players.size >= this.minPlayers);
  }

  private async enterCountdown(ms: number) {
    this.state = 'COUNTDOWN';
    // TODO: UI — countdown
    await this.sleep(ms);
  }

  private async enterRunning() {
    this.state = 'RUNNING';
    this.seed = Math.floor(Math.random() * 1_000_000);

    // TODO: spawn players at start; set alive=true
    this.deps.hazards.start(this.seed);
    await this.sleep(this.roundDurationMs);
    this.deps.hazards.stop();
  }

  private async enterResults(): Promise<any[]> {
    this.state = 'RESULTS';
    // TODO: calculate placements: survivalMs, aliveAtEnd, tokensEarned
    // TODO: UI — results + Play Again default
    await this.sleep(10_000);
    return [];
  }

  private sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  private async waitUntil(pred: () => boolean) {
    while (!pred()) await this.sleep(250);
  }
}
