import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../App';
import { analyzeFortune, fetchGongsu } from '../services/api';
import type { FortuneRequest, FortuneResponse } from '../services/api';

type GongsuScreenRouteProp = RouteProp<RootStackParamList, 'GongsuScreen'>;

const PrayerBanner: React.FC = () => {
  const [dots, setDots] = useState('');
  useEffect(() => {
    const id = setInterval(() => {
      setDots(prev => (prev.length >= 2 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(id);
  }, []);
  return (
    <View style={styles.prayerWrap}>
      <Text style={styles.prayerText}>천지선녀가 기도중{dots}</Text>
    </View>
  );
};

const FortuneView: React.FC<{ fortune: FortuneResponse; userInput: string }> = ({ fortune, userInput }) => (
  <View style={{ gap: 16 }}>
    <View style={styles.card}>
      <Text style={styles.label}>전해주신 고민</Text>
      <Text style={styles.questionText}>{userInput}</Text>
    </View>

    <View style={styles.card}>
      <Text style={styles.label}>사주 점사 결과</Text>
      <Text style={styles.answerText}>
        띠: {fortune.zodiac} / 출생 시(지지): {fortune.earthlyBranchHour}시
      </Text>
      <Text style={[styles.answerText, { marginTop: 8 }]}>{fortune.summary}</Text>

      <Text style={[styles.label, { marginTop: 10 }]}>전체 운</Text>
      <Text style={styles.answerText}>{fortune.sections.overview}</Text>

      <Text style={[styles.label, { marginTop: 8 }]}>연애/관계</Text>
      <Text style={styles.answerText}>{fortune.sections.love}</Text>

      <Text style={[styles.label, { marginTop: 8 }]}>일/커리어</Text>
      <Text style={styles.answerText}>{fortune.sections.career}</Text>

      <Text style={[styles.label, { marginTop: 8 }]}>건강/리듬</Text>
      <Text style={styles.answerText}>{fortune.sections.health}</Text>

      <Text style={[styles.label, { marginTop: 8 }]}>실행 제안</Text>
      {fortune.recommendations.map((r, i) => (
        <Text key={i} style={styles.answerText}>• {r}</Text>
      ))}
    </View>
  </View>
);

const GongsuScreen = () => {
  const route = useRoute<GongsuScreenRouteProp>();
  const { userInput, payload, fortune: preloadedFortune } = route.params;

  const [fortune, setFortune] = useState<FortuneResponse | null>(preloadedFortune ?? null);
  const [gongsu, setGongsu] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    if (payload) {
      (async () => {
        try {
          const result = await analyzeFortune(payload);
          if (alive) setFortune(result);
        } catch {
          if (alive) setGongsu('점사를 불러오는 데 실패했습니다.');
        } finally {
          if (alive) setLoading(false);
        }
      })();
    } else {
      (async () => {
        try {
          const result = await fetchGongsu(userInput, {});
          const text =
            typeof result === 'string'
              ? result
              : result?.message ?? result?.answer ?? '응답을 받아왔습니다.';
          if (alive) setGongsu(text);
        } catch {
          if (alive) setGongsu('공수를 불러오는 데 실패했습니다.');
        } finally {
          if (alive) setLoading(false);
        }
      })();
    }

    return () => {
      alive = false;
    };
  }, [userInput, payload, preloadedFortune]);

  return (
    <View style={styles.container}>
      {loading ? (
        <PrayerBanner />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {fortune ? (
            <FortuneView fortune={fortune} userInput={userInput} />
          ) : (
            <View style={styles.card}>
              <Text style={styles.label}>점사 결과</Text>
              <Text style={styles.answerText}>{gongsu}</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

export default GongsuScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d0d',
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingVertical: 24,
    gap: 20,
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ffcc99',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  label: {
    fontSize: 15,
    color: '#ffcc99',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 17,
    color: '#eaeaea',
    lineHeight: 24,
  },
  answerText: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 26,
    marginBottom: 4,
  },
  prayerWrap: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#1b1724',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#bfb3ff',
    marginTop: 40,
    shadowColor: '#bfb3ff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  prayerText: {
    color: '#EBD3FF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});