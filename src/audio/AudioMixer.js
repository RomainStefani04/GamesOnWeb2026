import { MusicChannel }   from './channels/MusicChannel.js';
import { SFXChannel }     from './channels/SFXChannel.js';
import { VoiceChannel }   from './channels/VoiceChannel.js';
import { SettingsManager } from '../core/SettingsManager.js';

/**
 * AudioMixer — Façade technique.
 * Orchestre les canaux, gère les volumes globaux et le mute master.
 */
export class AudioMixer {
  constructor(scene) {
    this.music    = new MusicChannel(scene);
    this.sfx      = new SFXChannel(scene);
    this.voice    = new VoiceChannel(scene);
    this._masterMuted  = false;
    this.setMasterVolume(SettingsManager.volume);
  }

  setMasterVolume(value) {
    this._masterVolume = Math.max(0, Math.min(1, value));
    this.music.setVolume(this._masterVolume);
    this.sfx.setVolume(this._masterVolume);
    this.voice.setVolume(this._masterVolume);
  }

  muteAll(value) {
    this._masterMuted = value;
    this.music.mute(value);
    this.sfx.mute(value);
    this.voice.mute(value);
  }

  /** Volumes indépendants par canal */
  setChannelVolume(channel, value) {
    this[channel]?.setVolume(value);
  }
}