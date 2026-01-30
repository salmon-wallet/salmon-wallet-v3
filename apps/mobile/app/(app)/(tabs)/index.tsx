import { StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';

export default function WalletScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wallet</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <Text style={styles.placeholder}>Wallet Overview</Text>
      <Text style={styles.subtitle}>Your balances will appear here</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
  placeholder: {
    fontSize: 18,
    color: '#888',
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 10,
  },
});
