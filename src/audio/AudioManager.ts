export class AudioManager {
	private sounds: Map<string, HTMLAudioElement> = new Map()

	public async load(name: string, url: string): Promise<void> {
		return new Promise((resolve, reject) => {
			try {
				const audio = new Audio(url)
				audio.preload = 'auto'
				audio.addEventListener('canplaythrough', () => {
					this.sounds.set(name, audio)
					resolve()
				})
				audio.addEventListener('error', (e) => reject(e))
				// trigger load
				audio.load()
			} catch (err) {
				reject(err)
			}
		})
	}

	public play(name: string, loop = false, volume = 1): void {
		const audio = this.sounds.get(name)
		if (!audio) return
		audio.loop = loop
		audio.volume = volume
		// Clone to allow overlapping identical sounds
		const clone = audio.cloneNode(true) as HTMLAudioElement
		clone.loop = loop
		clone.volume = volume
		clone.play().catch(() => { /* ignore play errors */ })
	}

	public stop(name: string): void {
		const audio = this.sounds.get(name)
		if (!audio) return
		audio.pause()
		audio.currentTime = 0
	}

	public setVolume(name: string, volume: number): void {
		const audio = this.sounds.get(name)
		if (!audio) return
		audio.volume = volume
	}

	public muteAll(muted: boolean): void {
		this.sounds.forEach(a => a.muted = muted)
	}
}
