import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Vibration,
  View,
} from 'react-native';

type TimerModeId = 'focus' | 'shortBreak' | 'longBreak' | 'sprint';

interface TimerMode {
  id: TimerModeId;
  label: string;
  defaultMinutes: number;
  accentColor: string;
  subtitle: string;
}

interface CompletedSession {
  id: string;
  modeLabel: string;
  task: string;
  minutes: number;
  completedAt: string;
}

const TIMER_MODES: TimerMode[] = [
  {
    id: 'focus',
    label: 'Focus',
    defaultMinutes: 25,
    accentColor: '#38BDF8',
    subtitle: 'Deep work interval',
  },
  {
    id: 'shortBreak',
    label: 'Short Break',
    defaultMinutes: 5,
    accentColor: '#34D399',
    subtitle: 'Quick recharge',
  },
  {
    id: 'longBreak',
    label: 'Long Break',
    defaultMinutes: 15,
    accentColor: '#A78BFA',
    subtitle: 'Full mental reset',
  },
  {
    id: 'sprint',
    label: 'Sprint',
    defaultMinutes: 10,
    accentColor: '#FBBF24',
    subtitle: 'Fast task burst',
  },
];

const QUICK_TASKS = ['Deep Work', 'Coding', 'Reading', 'Planning', 'Study'];

export default function App() {
  const [selectedMode, setSelectedMode] = useState<TimerMode>(TIMER_MODES[0]);
  const [customMinutes, setCustomMinutes] = useState<number>(TIMER_MODES[0].defaultMinutes);
  const [secondsLeft, setSecondsLeft] = useState<number>(TIMER_MODES[0].defaultMinutes * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [taskName, setTaskName] = useState<string>('Deep Work');
  const [history, setHistory] = useState<CompletedSession[]>([]);
  const [showPrivacyModal, setShowPrivacyModal] = useState<boolean>(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSeconds = customMinutes * 60;
  const progress =
    totalSeconds > 0 ? Math.min(1, Math.max(0, (totalSeconds - secondsLeft) / totalSeconds)) : 0;

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  useEffect(() => {
    if (secondsLeft === 0 && isRunning) {
      setIsRunning(false);
      if (Platform.OS !== 'web') {
        Vibration.vibrate(400);
      }
      recordSession(customMinutes);
      setSecondsLeft(customMinutes * 60);
    }
  }, [secondsLeft, isRunning, customMinutes]);

  const recordSession = (minutesCompleted: number) => {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newEntry: CompletedSession = {
      id: `${now.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
      modeLabel: selectedMode.label,
      task: taskName.trim() || 'Untitled Session',
      minutes: minutesCompleted,
      completedAt: timeString,
    };
    setHistory((prev) => [newEntry, ...prev]);
  };

  const handleSelectMode = (mode: TimerMode) => {
    setIsRunning(false);
    setSelectedMode(mode);
    setCustomMinutes(mode.defaultMinutes);
    setSecondsLeft(mode.defaultMinutes * 60);
  };

  const handleAdjustMinutes = (delta: number) => {
    if (isRunning) return;
    const next = Math.min(90, Math.max(1, customMinutes + delta));
    setCustomMinutes(next);
    setSecondsLeft(next * 60);
  };

  const handleToggleStart = () => {
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(customMinutes * 60);
  };

  const handleCompleteEarly = () => {
    const elapsedMinutes = Math.max(1, Math.round((totalSeconds - secondsLeft) / 60));
    setIsRunning(false);
    recordSession(elapsedMinutes);
    setSecondsLeft(customMinutes * 60);
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const paddedMins = mins < 10 ? `0${mins}` : `${mins}`;
    const paddedSecs = secs < 10 ? `0${secs}` : `${secs}`;
    return `${paddedMins}:${paddedSecs}`;
  };

  const completedFocusCount = history.filter(
    (item) => item.modeLabel === 'Focus' || item.modeLabel === 'Sprint'
  ).length;
  const totalMinutesLogged = history.reduce((sum, item) => sum + item.minutes, 0);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appTitle}>FocusPulse</Text>
            <Text style={styles.appSubtitle}>Offline Pomodoro & Task Timer</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Privacy and App Information"
            onPress={() => setShowPrivacyModal(true)}
            style={styles.infoButton}
          >
            <Text style={styles.infoButtonText}>Privacy & Info</Text>
          </Pressable>
        </View>

        {/* Mode Selector Tabs */}
        <View style={styles.modeRow}>
          {TIMER_MODES.map((mode) => {
            const active = mode.id === selectedMode.id;
            return (
              <Pressable
                key={mode.id}
                onPress={() => handleSelectMode(mode)}
                style={[
                  styles.modeTab,
                  active && {
                    backgroundColor: '#1E293B',
                    borderColor: mode.accentColor,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.modeTabText,
                    active && { color: mode.accentColor, fontWeight: '700' },
                  ]}
                >
                  {mode.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Timer Card */}
        <View style={[styles.timerCard, { borderColor: selectedMode.accentColor + '44' }]}>
          <View style={styles.statusBadge}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isRunning ? selectedMode.accentColor : '#64748B' },
              ]}
            />
            <Text style={styles.statusText}>
              {isRunning ? `RUNNING • ${selectedMode.subtitle.toUpperCase()}` : 'READY TO START'}
            </Text>
          </View>

          <Text style={[styles.timerDigits, { color: selectedMode.accentColor }]}>
            {formatTime(secondsLeft)}
          </Text>

          {/* Progress Bar */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.round(progress * 100)}%`,
                  backgroundColor: selectedMode.accentColor,
                },
              ]}
            />
          </View>

          {/* Duration Adjuster */}
          <View style={styles.adjustRow}>
            <Pressable
              onPress={() => handleAdjustMinutes(-5)}
              disabled={isRunning}
              style={[styles.adjustBtn, isRunning && styles.disabledBtn]}
            >
              <Text style={styles.adjustBtnText}>-5m</Text>
            </Pressable>
            <Pressable
              onPress={() => handleAdjustMinutes(-1)}
              disabled={isRunning}
              style={[styles.adjustBtn, isRunning && styles.disabledBtn]}
            >
              <Text style={styles.adjustBtnText}>-1m</Text>
            </Pressable>
            <Text style={styles.adjustLabel}>{customMinutes} min target</Text>
            <Pressable
              onPress={() => handleAdjustMinutes(1)}
              disabled={isRunning}
              style={[styles.adjustBtn, isRunning && styles.disabledBtn]}
            >
              <Text style={styles.adjustBtnText}>+1m</Text>
            </Pressable>
            <Pressable
              onPress={() => handleAdjustMinutes(5)}
              disabled={isRunning}
              style={[styles.adjustBtn, isRunning && styles.disabledBtn]}
            >
              <Text style={styles.adjustBtnText}>+5m</Text>
            </Pressable>
          </View>

          {/* Primary Action Buttons */}
          <View style={styles.controlsRow}>
            <Pressable
              onPress={handleToggleStart}
              style={[styles.primaryButton, { backgroundColor: selectedMode.accentColor }]}
            >
              <Text style={styles.primaryButtonText}>{isRunning ? 'Pause' : 'Start Timer'}</Text>
            </Pressable>

            <Pressable onPress={handleReset} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Reset</Text>
            </Pressable>
          </View>

          {secondsLeft < totalSeconds && (
            <Pressable onPress={handleCompleteEarly} style={styles.completeEarlyButton}>
              <Text style={styles.completeEarlyText}>✓ Log Current Session & Reset</Text>
            </Pressable>
          )}
        </View>

        {/* Active Task Input & Quick Tags */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Current Focus Task</Text>
          <TextInput
            value={taskName}
            onChangeText={setTaskName}
            placeholder="What are you working on?"
            placeholderTextColor="#64748B"
            style={styles.taskInput}
            maxLength={50}
          />
          <View style={styles.tagRow}>
            {QUICK_TASKS.map((tag) => {
              const selected = taskName === tag;
              return (
                <Pressable
                  key={tag}
                  onPress={() => setTaskName(tag)}
                  style={[
                    styles.tagChip,
                    selected && {
                      backgroundColor: selectedMode.accentColor + '22',
                      borderColor: selectedMode.accentColor,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tagChipText,
                      selected && { color: selectedMode.accentColor, fontWeight: '600' },
                    ]}
                  >
                    {tag}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Summary Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{completedFocusCount}</Text>
            <Text style={styles.statLabel}>Focus Sessions</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{totalMinutesLogged}m</Text>
            <Text style={styles.statLabel}>Total Logged</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{history.length}</Text>
            <Text style={styles.statLabel}>Intervals Done</Text>
          </View>
        </View>

        {/* Session Log */}
        <View style={styles.sectionCard}>
          <View style={styles.logHeaderRow}>
            <Text style={styles.sectionTitle}>Session History</Text>
            {history.length > 0 && (
              <Pressable onPress={() => setHistory([])}>
                <Text style={styles.clearLogText}>Clear</Text>
              </Pressable>
            )}
          </View>

          {history.length === 0 ? (
            <Text style={styles.emptyHistoryText}>
              No sessions completed yet. Start the timer or tap &ldquo;Log Current Session&rdquo; to
              record your progress.
            </Text>
          ) : (
            history.map((item) => (
              <View key={item.id} style={styles.historyItem}>
                <View style={styles.historyItemLeft}>
                  <Text style={styles.historyTask}>{item.task}</Text>
                  <Text style={styles.historyMeta}>
                    {item.modeLabel} • {item.completedAt}
                  </Text>
                </View>
                <View style={styles.historyBadge}>
                  <Text style={styles.historyBadgeText}>{item.minutes} min</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Privacy & App Info Modal */}
      <Modal
        visible={showPrivacyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>About FocusPulse Timer</Text>
            <Text style={styles.modalVersion}>Version 1.0.0 • 100% Offline Utility</Text>

            <Text style={styles.modalHeading}>Privacy Policy Summary</Text>
            <Text style={styles.modalBody}>
              FocusPulse Timer does not collect, store, transmit, or share any personal data,
              device identifiers, analytics, or usage telemetry.
            </Text>
            <Text style={styles.modalBody}>
              • Zero device permissions required{'\n'}
              • Zero third-party SDKs, trackers, or ads{'\n'}
              • All timer sessions exist strictly locally on your device during your session
            </Text>

            <Pressable
              onPress={() => setShowPrivacyModal(false)}
              style={[styles.modalCloseBtn, { backgroundColor: selectedMode.accentColor }]}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 40,
    paddingHorizontal: 20,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.3,
  },
  appSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  infoButton: {
    backgroundColor: '#1E293B',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoButtonText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },
  modeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 18,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: '#131C31',
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
  },
  modeTabText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  timerCard: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 18,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.6,
  },
  timerDigits: {
    fontSize: 72,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
    marginVertical: 8,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: '#0F172A',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 18,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  adjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  adjustBtn: {
    backgroundColor: '#0F172A',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  disabledBtn: {
    opacity: 0.4,
  },
  adjustBtnText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },
  adjustLabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    marginHorizontal: 6,
  },
  controlsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    flex: 2,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '600',
  },
  completeEarlyButton: {
    marginTop: 14,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  completeEarlyText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  sectionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  taskInput: {
    backgroundColor: '#0F172A',
    color: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
  },
  tagChipText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statValue: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  logHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  clearLogText: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyHistoryText: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  historyItemLeft: {
    flex: 1,
    paddingRight: 10,
  },
  historyTask: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '600',
  },
  historyMeta: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  historyBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  historyBadgeText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '800',
  },
  modalVersion: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  modalHeading: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  modalBody: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
  modalCloseBtn: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 14,
  },
});
