import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>GUZO Driver</Text>
      <Text style={styles.subtitle}>Driver onboarding foundation</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: '700'
  },
  subtitle: {
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 15
  }
});
