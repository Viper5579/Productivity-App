import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function HabitsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Habits</Text>
        <Text style={styles.text}>Track your daily habits and build streaks</Text>
        <Text style={styles.subtitle}>Coming soon...</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  section: { padding: 20, alignItems: 'center', paddingTop: 60 },
  sectionTitle: { fontSize: 32, fontWeight: 'bold', marginBottom: 16 },
  text: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#9CA3AF', marginTop: 20 },
});
