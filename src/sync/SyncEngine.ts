import { PlaybackStateDoc } from '../store/playbackStore';

interface SyncEngineOptions {
  onPlay: () => void;
  onPause: () => void;
  onSeek: (position: number) => void;
  onChangeMedia: (url: string, type: string, index: number) => void;
  getActualPosition: () => number;
  isHost: boolean;
  driftThresholdMs?: number;
  hardSeekThresholdMs?: number;
}

export class SyncEngine {
  private lastProcessedCommandId: string | null = null;
  private currentVersion: number = 0;
  private options: SyncEngineOptions;
  
  private expectedPosition: number = 0;
  private isPlaying: boolean = false;
  private lastUpdatedAt: number = 0;
  
  private syncInterval: number | null = null;

  constructor(options: SyncEngineOptions) {
    this.options = {
      driftThresholdMs: 250,
      hardSeekThresholdMs: 1000,
      ...options
    };
  }

  public processState(state: PlaybackStateDoc) {
    if (!state) return;
    
    // Ignore old commands
    if (state.playbackVersion < this.currentVersion) return;
    
    const isNewCommand = state.commandId !== this.lastProcessedCommandId;
    this.lastProcessedCommandId = state.commandId;
    this.currentVersion = state.playbackVersion;
    
    const updatedAtTime = state.updatedAt ? (state.updatedAt.toMillis ? state.updatedAt.toMillis() : Date.now()) : Date.now();
    this.lastUpdatedAt = updatedAtTime;
    this.isPlaying = state.isPlaying;
    this.expectedPosition = state.position;

    if (isNewCommand) {
      this.executeCommand(state);
    }
  }

  private executeCommand(state: PlaybackStateDoc) {
    const { command, position, mediaUrl, mediaType, currentIndex } = state;
    
    if (command === 'CHANGE_MEDIA' || command === 'NEXT' || command === 'PREVIOUS') {
      this.options.onChangeMedia(mediaUrl, mediaType, currentIndex);
      if (this.isPlaying) {
        this.options.onPlay();
      } else {
        this.options.onPause();
      }
      return;
    }

    if (command === 'PLAY') {
      const targetPos = this.calculateTargetPosition();
      this.options.onSeek(targetPos);
      this.options.onPlay();
      return;
    }

    if (command === 'PAUSE') {
      this.options.onPause();
      this.options.onSeek(position);
      return;
    }

    if (command === 'SEEK') {
      this.options.onSeek(position);
      if (this.isPlaying) {
        this.options.onPlay();
      }
      return;
    }
  }

  public calculateTargetPosition(): number {
    if (!this.isPlaying) {
      return this.expectedPosition;
    }
    const now = Date.now();
    const elapsedSeconds = (now - this.lastUpdatedAt) / 1000;
    return this.expectedPosition + Math.max(0, elapsedSeconds);
  }

  public checkDrift() {
    if (!this.isPlaying || this.options.isHost) return;

    const actual = this.options.getActualPosition();
    const target = this.calculateTargetPosition();
    
    const drift = Math.abs(target - actual) * 1000; // in ms
    
    if (drift > this.options.hardSeekThresholdMs!) {
      // Hard correction
      console.log(`[SyncEngine] Hard correction: drift=${drift}ms. Seeking to ${target}`);
      this.options.onSeek(target);
    } else if (drift > this.options.driftThresholdMs!) {
      // Gradual correction could be implemented via playbackRate adjustments, 
      // but for simplicity and robustness across browsers, we do a mini seek if it's drifting noticeably.
      console.log(`[SyncEngine] Minor drift: ${drift}ms. Correcting...`);
      this.options.onSeek(target);
    }
  }

  public startPeriodicSync() {
    this.stopPeriodicSync();
    this.syncInterval = window.setInterval(() => {
      this.checkDrift();
    }, 3000);
  }

  public stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}
