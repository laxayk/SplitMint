import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Text, View } from 'react-native';

/** Brand splash: logo springs in, wordmark and a thin progress line follow. */
export default function Splash({ onDone }: { onDone: () => void }) {
  const logo = useRef(new Animated.Value(0)).current;
  const text = useRef(new Animated.Value(0)).current;
  const bar = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.spring(logo, { toValue: 1, friction: 6, tension: 60, useNativeDriver: false }),
      Animated.timing(text, { toValue: 1, duration: 350, useNativeDriver: false }),
      Animated.timing(bar, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
    ]).start(() => setTimeout(onDone, 150));
  }, []);
  return (
    <View style={{ flex: 1, backgroundColor: '#06332E', alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ opacity: logo, transform: [{ scale: logo.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] }}>
        <Image source={require('../../assets/logo.png')} style={{ width: 132, height: 132, borderRadius: 30 }} />
      </Animated.View>
      <Animated.View style={{ opacity: text, marginTop: 22, alignItems: 'center', transform: [{ translateY: text.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }}>
        <Text style={{ color: '#E8F5F0', fontSize: 34, fontWeight: '800', letterSpacing: -1 }}>SplitMint</Text>
        <Text style={{ color: '#8FD9C8', fontSize: 14, marginTop: 6, letterSpacing: 1.5 }}>SPLIT IT. SETTLE IT.</Text>
      </Animated.View>
      <View style={{ position: 'absolute', bottom: 70, width: 120, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)' }}>
        <Animated.View style={{ height: 3, borderRadius: 2, backgroundColor: '#2DD4BF', width: bar.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />
      </View>
    </View>
  );
}
