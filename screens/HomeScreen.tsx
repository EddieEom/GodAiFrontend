// screens/HomeScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Platform, ScrollView, KeyboardAvoidingView, Alert, Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { Picker } from '@react-native-picker/picker';

import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { analyzeFortune } from '../services/api';

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'HomeScreen'
>;

const BRANCH_TO_TIME: Record<string, string> = {
  모름: '12:00',
  자시: '00:00',
  축시: '02:00',
  인시: '04:00',
  묘시: '06:00',
  진시: '08:00',
  사시: '10:00',
  오시: '12:00',
  미시: '14:00',
  신시: '16:00',
  유시: '18:00',
  술시: '20:00',
  해시: '22:00',
};

const BRANCH_TO_RANGE: Record<string, string> = {
  모름: '시간 미상',
  자시: '23:00~01:29',
  축시: '01:30~03:29',
  인시: '03:30~05:29',
  묘시: '05:30~07:29',
  진시: '07:30~09:29',
  사시: '09:30~11:29',
  오시: '11:30~13:29',
  미시: '13:30~15:29',
  신시: '15:30~17:29',
  유시: '17:30~19:29',
  술시: '19:30~21:29',
  해시: '21:30~23:29',
};

const formatDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false); // ✅ 추가
  const [birthTime, setBirthTime] = useState('모름'); // 지지(문자)
  const [unknownTime, setUnknownTime] = useState(true);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);

  const timeOptions = [
    { label: '모름', value: '모름' },
    { label: '자시 (23:30-01:29)', value: '자시' },
    { label: '축시 (01:30-03:29)', value: '축시' },
    { label: '인시 (03:30-05:29)', value: '인시' },
    { label: '묘시 (05:30-07:29)', value: '묘시' },
    { label: '진시 (07:30-09:29)', value: '진시' },
    { label: '사시 (09:30-11:29)', value: '사시' },
    { label: '오시 (11:30-13:29)', value: '오시' },
    { label: '미시 (13:30-15:29)', value: '미시' },
    { label: '신시 (15:30-17:29)', value: '신시' },
    { label: '유시 (17:30-19:29)', value: '유시' },
    { label: '술시 (19:30-21:29)', value: '술시' },
    { label: '해시 (21:30-23:29)', value: '해시' },
  ];

  const disabled = name.trim() === '' || userInput.trim() === '';

  const handleStartShin = () => {
    const q = userInput.trim();
    const nm = name.trim();

    if (!nm) return Alert.alert('입력 오류', '이름을 입력하세요.');
    if (!q) return Alert.alert('입력 오류', '고민을 입력하세요.');

    // 지지 → 대표 HH:mm
    const resolvedBirthTime =
      unknownTime || birthTime === '모름'
        ? '12:00'
        : BRANCH_TO_TIME[birthTime] ?? '12:00';

    // LLM에 참고 문구 덧붙이기(선택)
    const concernForLLM =
      unknownTime || birthTime === '모름'
        ? q
        : `${q}\n[참고] 출생 시간대: ${birthTime} · ${BRANCH_TO_RANGE[birthTime]}`;

    const payload = {
      name: nm,
      birthDate: formatDate(birthDate), // YYYY-MM-DD
      birthTime: resolvedBirthTime,     // HH:mm
      timezone: 'Asia/Seoul',
      calendarType: 'solar' as const,
      isLeapMonth: false,               // 백엔드 스키마에 있으면 유지
      concern: concernForLLM,
    };

    navigation.navigate('GongsuScreen', { userInput: q, payload });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={headerHeight}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <Text style={styles.title}>神천지선녀에게 고민을 말해보세요</Text>

            {/* 이름 */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>이름</Text>
              <TextInput
                style={styles.input}
                placeholder="홍길동"
                placeholderTextColor="#8f8f8f"
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* 생년월일 (Expo Go 호환 DateTimePicker) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>생년월일</Text>

              {/* 표시용 터치 박스 */}
              <TouchableOpacity
                style={[styles.input, { justifyContent: 'center' }]}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.8}
              >

              <Text style={{ color: '#fff' }}>{formatDate(birthDate)}</Text>
            </TouchableOpacity>

              {/* 실제 피커: iOS는 인라인/스피너, Android는 캘린더 모달 */}
              
              <DateTimePickerModal
                isVisible={showDatePicker}
                mode="date"
                onConfirm={(date) => {
                  setBirthDate(date);
                  setShowDatePicker(false);
                }}
                onCancel={() => setShowDatePicker(false)}
                locale="ko-KR"
                maximumDate={new Date()}
                cancelTextIOS="취소"
                confirmTextIOS="확인"
                buttonTextColorIOS="#6600cc"
                isDarkModeEnabled={false} // 밝은 모드 강제 적용
              />


            </View>

            {/* 시간 미상 스위치 */}
            <View style={[styles.fieldRow, { marginBottom: 8 }]}>
              <Text style={styles.label}>태어난 시간 미상</Text>
              <Switch
                value={unknownTime}
                onValueChange={(v) => {
                  setUnknownTime(v);
                  if (v) setBirthTime('모름');
                }}
                thumbColor={Platform.OS === 'android' ? '#6600cc' : undefined}
                trackColor={{ true: '#6600cc66', false: '#555' }}
              />
            </View>

            {/* 지지 선택 (미상 해제 시 표시) */}
            {!unknownTime && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>태어난 시간</Text>
                <Picker
                  selectedValue={birthTime}
                  onValueChange={(value) => setBirthTime(String(value))}
                  dropdownIconColor="#ffcc99"
                >
                  {timeOptions.map((option) => (
                    <Picker.Item
                      key={option.value}
                      label={option.label}
                      value={option.value}
                      color="#fff"
                    />
                  ))}
                </Picker>
              </View>
            )}

            {/* 고민 */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>고민</Text>
              <TextInput
                style={[styles.input, { minHeight: 150, maxHeight: 280 }]}
                placeholder="현재 상황과 고민을 자유롭게 적어주세요..."
                placeholderTextColor="#8f8f8f"
                value={userInput}
                onChangeText={setUserInput}
                multiline
                maxLength={600}
                textAlignVertical="top"
              />
            </View>
          </View>
        </ScrollView>

        {/* 하단 버튼 */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TouchableOpacity
            style={[styles.button, (disabled || loading) && styles.buttonDisabled]}
            onPress={handleStartShin}
            disabled={disabled || loading}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>{loading ? '점사 중...' : '보내기'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default HomeScreen;


const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0d0d0d' },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12 },
  title: { fontSize: 22, color: '#f8f8f8', marginBottom: 20, fontWeight: 'bold' },

  fieldGroup: { marginBottom: 14 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: {color: '#e0e0e0', marginBottom: 6 },

  input: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    color: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },

  footer: {
    borderTopWidth: 1,
    borderTopColor: '#1f1f1f',
    backgroundColor: '#0d0d0d',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  button: {
    height: 52,
    borderRadius: 12,
    backgroundColor: '#6600cc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#6600cc66',
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
