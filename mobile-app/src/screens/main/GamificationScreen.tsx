import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function GamificationScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.level}>Level 1</Text>
        <Text style={styles.xp}>0 / 100 XP</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: '0%' }]} />
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎮 Coming Soon!</Text>
        <Text style={styles.text}>XP, levels, achievements, and more...</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 20, backgroundColor: '#FFFFFF', alignItems: 'center' },
  level: { fontSize: 32, fontWeight: 'bold', color: '#6366F1' },
  xp: { fontSize: 16, color: '#6B7280', marginTop: 8 },
  progressBar: { height: 8, backgroundColor: '#E5E7EB', margin: 20, borderRadius: 4 },
  progressFill: { height: '100%', backgroundColor: '#6366F1', borderRadius: 4 },
  section: { padding: 20, alignItems: 'center' },
  sectionTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  text: { fontSize: 16, color: '#6B7280', textAlign: 'center' },
});
