import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { VideoView, useVideoPlayer } from 'expo-video';

type SplashVideoProps = {
  onFinish: () => void;
};

const videoSource = require('../assets/ta-1.mp4');

export function SplashVideo({ onFinish }: SplashVideoProps) {
  const muted = Platform.OS === 'web';
  const player = useVideoPlayer(videoSource, (playerInstance) => {
    try {
      playerInstance.loop = false;
      playerInstance.muted = muted;
      playerInstance.currentTime = 0;
      playerInstance.play();
    } catch (error) {
      // Silently handle video init errors
      onFinish();
    }
  });

  // Handle keep-awake errors (non-critical, can be ignored)
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        const errorMessage = event.reason?.message || event.reason?.toString() || '';
        if (errorMessage.includes('keep awake') || errorMessage.includes('Unable to activate keep awake')) {
          event.preventDefault();
          // Silently ignore keep-awake errors - they're non-critical
          return;
        }
      };

      window.addEventListener('unhandledrejection', handleUnhandledRejection);
      return () => {
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      };
    }
  }, []);

  useEffect(() => {
    const endSub = player.addListener('playToEnd', () => {
      onFinish();
    });
    // Safety timeout in case no events fire (codec not supported, etc.)
    const safety = setTimeout(() => {
      if (!player.playing) {
        onFinish();
      }
    }, 12000);
    return () => {
      endSub.remove();
      clearTimeout(safety);
      try {
        player.pause();
      } catch {
        // ignore
      }
    };
  }, [onFinish, player]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#57626E" />
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        allowsPictureInPicture={false}
        contentFit="contain"
        nativeControls={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#57626E',
  },
});