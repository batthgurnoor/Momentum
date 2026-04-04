import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ImageBackground, StyleSheet, View } from 'react-native';
import { COLORS } from '../theme/colors';
import { resolveExerciseGifUrl } from '../utils/exerciseGifUrls';

const exerciseFallbackImage = require('../../assets/images/exercise1.jpg');

/**
 * Firebase Storage GIF (or fallback JPEG) for exercise library cards — same resolution path as Train tab.
 */
export default function ExerciseGifCardMedia({
  intensity,
  gifFileName,
  style,
  imageStyle,
  children,
  accentColor,
}) {
  const accent = accentColor ?? COLORS.app.accent;
  const [uri, setUri] = useState(null);
  const [resolving, setResolving] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setResolving(true);
    setUri(null);

    (async () => {
      const url = await resolveExerciseGifUrl(intensity, gifFileName);
      if (cancelled) return;
      setUri(url);
      setResolving(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [intensity, gifFileName]);

  return (
    <ImageBackground
      source={uri ? { uri } : exerciseFallbackImage}
      style={style}
      imageStyle={imageStyle}
      resizeMode="cover"
    >
      {resolving ? (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
          ]}
        >
          <ActivityIndicator size="small" color={accent} />
        </View>
      ) : null}
      {children}
    </ImageBackground>
  );
}
