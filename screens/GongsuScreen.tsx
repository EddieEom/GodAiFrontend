import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../App';
import type { FortuneRequest } from '../services/api';

type Nav = NavigationProp<RootStackParamList, 'HomeScreen'>;

/** 지지(자시~해시) 옵션 - UI 표시용 */
const BRANCH_OPTIONS = [
  { value: '미상', label: '미상(모름)' },
  { value: '자시', label: '자시(子時) · 23:30–01:29' },
  { value: '축시', label: '축시(丑時) · 01:30–03:29' },
  { value: '인시', label: '인시(寅時) · 03:30–05:29' },
  { value: '묘시', label: '묘시(卯時) · 05:30–07:29' },
  { value: '진시', label: '진시(辰時) · 07:30–09:29' },
  { value: '사시', label: '사시(巳時) · 09:30–11:29' },
  { value: '오시', label: '오시(午時) · 11:30–13:29' },
  { value: '미시', label: '미시(未時) · 13:30–15:29' },
  { value: '신시', label: '신시(申時) · 15:30–17:29' },
  { value: '유시', label: '유시(酉시) · 17:30–19:29' }, // 표기 상 "酉時"
  { value: '술시', label: '술시(戌時) · 19:30–21:29' },
  { value: '해시', label: '해시(亥時) · 21:30–23:29' },
];

/** 지지 → 대표 시간(HH:mm) 매핑 (백엔드 수정 없이 지지 계산 유도) */
const BRANCH_TO_TIME: Record<string, string> = {
  자시: '00:30', // 23:30–01:29
  축시: '02:00', // 01:30–03:29
  인시: '04:00', // 03:30–05:29
  묘시: '06:00', // 05:30–07:29
  진시: '08:00', // 07:30–09:29
  사시: '10:00', // 09:30–11:29
  오시: '12:00', // 11:30–13:29
  미시: '14:00', // 13:30–15:29
  신시: '16:00', // 15:30–17:29
  유시: '18:00', // 17:30–19:29
  술시: '20:00', // 19:30–21:29
  해시: '22:00', // 21:30–23:29
};

/** 지지 → 시간대 범위 문자열 (LLM에 그대로 전달하기 위한 참고 문구) */
const BRANCH_TO_RANGE: Record<string, string> = {
  자시: '23:30–01:29',
  축시: '01:30–03:29',
  인시: '03:30–05:29',
  묘시: '05:30–07:29',
  진시: '07:30–09:29',
  사시: '09:30–11:29',
  오시: '11:30–13:29',
  미시: '13:30–15:29',
  신시: '15:30–17:29',
  유시: '17:30–19:29',
  술시: '19:30–21:29',
  해시: '21:30–23:29',
};

function daysInMonth(year: number, month: number) {
  // month: 1~12
  return new Date(year, month, 0).getDate();
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();

  const now = new Date();
  const currentYear = now.getFullYear();

  // UI 입력값
  const [name, setName] = useState('');
  const [concern, setConcern] = useState('');

  // 기본값: 오늘 기준으로 설정 (편의)
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(now.getMonth() + 1); // 1~12
  const [day, setDay] = useState(now.getDate());

  const [timeBranch, setTimeBranch] = useState<string>('미상');

  // 연도 목록: 1930 ~ 현재년도 (원하시면 범위 변경)
  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = currentYear; y >= 1930; y--) arr.push(y);
    return arr;
  }, [currentYear]);

  // 월 목록: 1~12
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);

  // 선택된 연/월에 맞춰 일수 동적 생성
  const days = useMemo(() => {
    const d = daysInMonth(year, month);
    return Array.from({ length: d }, (_, i) => i + 1);
  }, [year, month]);

  // 연/월 변경 시, 현재 day가 일수보다 크면 보정
  useEffect(() => {
    const max = daysInMonth(year, month);
    if (day > max) setDay(max);
  }, [year, month]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = () => {
    const nameTrim = name.trim();
    const concernTrim = concern.trim();

    if (!nameTrim) {
      Alert.alert('입력 확인', '이름을 입력해주세요.');
      return;
    }
    if (!concernTrim) {
      Alert.alert('입력 확인', '고민을 입력해주세요.');
      return;
    }

    // 1) 날짜 문자열로 변환 (YYYY-MM-DD)
    const birthDateStr = `${year}-${pad2(month)}-${pad2(day)}`;

    // 2) 지지 선택 → 대표 시간으로 변환 (A안: 백엔드 수정 없음)
    const birthTimeStr =
      timeBranch === '미상' ? '12:00' : BRANCH_TO_TIME[timeBranch];

    // 3) LLM이 시간대 범위를 직접 인지할 수 있도록 concern에 참고 문구 덧붙임
    const concernForLLM =
      timeBranch === '미상'
        ? concernTrim
        : `${concernTrim}\n[참고] 출생 시간대: ${timeBranch} · ${BRANCH_TO_RANGE[timeBranch]}`;

    // 4) 백엔드 요청 페이로드 구성 (백엔드 모델과 동일 키 사용)
    const payload: FortuneRequest = {
      name: nameTrim,
      birthDate: birthDateStr,     // 'YYYY-MM-DD'
      birthTime: birthTimeStr,     // 'HH:mm'
      timezone: 'Asia/Seoul',
      calendarType: 'solar',
      isLeapMonth: false,
      concern: concernForLLM,      // LLM용 참고 범위 포함
    } as FortuneRequest;

    // 5) GongsuScreen으로 이동
    navigation.navigate('GongsuScreen', {
      userInput: concernTrim, // 화면에는 원문 그대로 표시
      payload,
      fortune: undefined,     // 사전 계산 없이 GongsuScreen에서 analyzeFortune 호출
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0d0d0d' }}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>천지선녀에게 점사를 청합니다</Text>

        {/* 이름 */}
        <View style={styles.card}>
          <Text style={styles.label}>이름</Text>
          <TextInput
            placeholder="이름을 입력하세요"
            placeholderTextColor="#8f8f8f"
            value={name}
            onChangeText={setName}
            style={styles.textInput}
          />
        </View>

        {/* 생년월일 */}
        <View style={styles.card}>
          <Text style={styles.label}>생년월일</Text>
          <View style={styles.row}>
            {/* 연 */}
            <View style={styles.pickerWrap}>
              <Text style={styles.pickerLabel}>년</Text>
              <View style={styles.pickerBox}>
                <Picker
                  selectedValue={year}
                  onValueChange={(v) => setYear(Number(v))}
                  dropdownIconColor="#ffcc99"
                  style={styles.picker}
                >
                  {years.map((y) => (
                    <Picker.Item key={y} label={`${y}년`} value={y} color="#fff" />
                  ))}
                </Picker>
              </View>
            </View>

            {/* 월 */}
            <View style={styles.pickerWrap}>
              <Text style={styles.pickerLabel}>월</Text>
              <View style={styles.pickerBox}>
                <Picker
                  selectedValue={month}
                  onValueChange={(v) => setMonth(Number(v))}
                  dropdownIconColor="#ffcc99"
                  style={styles.picker}
                >
                  {months.map((m) => (
                    <Picker.Item key={m} label={`${m}월`} value={m} color="#fff" />
                  ))}
                </Picker>
              </View>
            </View>

            {/* 일 */}
            <View style={styles.pickerWrap}>
              <Text style={styles.pickerLabel}>일</Text>
              <View style={styles.pickerBox}>
                <Picker
                  selectedValue={day}
                  onValueChange={(v) => setDay(Number(v))}
                  dropdownIconColor="#ffcc99"
                  style={styles.picker}
                >
                  {days.map((d) => (
                    <Picker.Item key={d} label={`${d}일`} value={d} color="#fff" />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
        </View>

        {/* 출생 시(지지) */}
        <View style={styles.card}>
          <Text style={styles.label}>출생 시(지지)</Text>
          <View style={styles.pickerBox}>
            <Picker
              selectedValue={timeBranch}
              onValueChange={(v) => setTimeBranch(String(v))}
              dropdownIconColor="#ffcc99"
              style={styles.picker}
            >
              {BRANCH_OPTIONS.map((opt) => (
                <Picker.Item key={opt.value} label={opt.label} value={opt.value} color="#fff" />
              ))}
            </Picker>
          </View>
          <Text style={styles.helpText}>
            태어난 시간을 정확히 모르면 ‘미상(모름)’으로 선택하셔도 됩니다.
          </Text>
        </View>

        {/* 고민 */}
        <View style={styles.card}>
          <Text style={styles.label}>고민</Text>
          <TextInput
            placeholder="지금 가장 마음에 걸리는 고민을 적어주세요"
            placeholderTextColor="#8f8f8f"
            value={concern}
            onChangeText={setConcern}
            style={[styles.textInput, { height: 120, textAlignVertical: 'top' }]}
            multiline
          />
        </View>

        {/* 제출 버튼 */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitText}>점사 요청하기</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
  },
  title: {
    color: '#EBD3FF',
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: 'JosonGungseo',
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ffcc99',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  label: {
    fontSize: 16,
    color: '#ffcc99',
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: 'JosonGungseo',
  },
  textInput: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#3a3a3a',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 16,
    fontFamily: 'JosonGungseo',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  pickerWrap: {
    flex: 1,
  },
  pickerLabel: {
    color: '#cfa97a',
    fontSize: 14,
    marginBottom: 6,
    fontFamily: 'JosonGungseo',
  },
  pickerBox: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#3a3a3a',
    borderRadius: 10,
    overflow: 'hidden',
  },
  picker: {
    color: '#fff',
    height: 48,
  },
  helpText: {
    marginTop: 8,
    color: '#b7b7b7',
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'JosonGungseo',
  },
  submitBtn: {
    backgroundColor: '#bfb3ff',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EBD3FF',
  },
  submitText: {
    color: '#1b1724',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 18,
    fontFamily: 'JosonGungseo',
  },
});
