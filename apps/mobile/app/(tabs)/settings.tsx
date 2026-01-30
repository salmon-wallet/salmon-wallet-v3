import { StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text, View } from '@/components/Themed';
import { useLanguage } from '../../src/i18n';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { availableLanguages, changeLanguage, isChanging } = useLanguage();

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>{t('settings.title')}</Text>
        <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />

        {/* Language Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.languages.title')}</Text>
          <View style={styles.languageList}>
            {availableLanguages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageOption,
                  lang.isSelected && styles.languageOptionSelected,
                ]}
                onPress={() => changeLanguage(lang.code)}
                disabled={isChanging || lang.isSelected}
              >
                <Text
                  style={[
                    styles.languageText,
                    lang.isSelected && styles.languageTextSelected,
                  ]}
                >
                  {lang.name}
                </Text>
                {lang.isSelected && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Other Settings */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>{t('settings.security')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>{t('settings.address_book')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>{t('settings.notifications')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>{t('settings.help_support')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 20,
    height: 1,
    width: '100%',
  },
  section: {
    width: '100%',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#666',
  },
  languageList: {
    backgroundColor: 'transparent',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
  },
  languageOptionSelected: {
    backgroundColor: 'rgba(100, 180, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(100, 180, 255, 0.5)',
  },
  languageText: {
    fontSize: 16,
  },
  languageTextSelected: {
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 18,
    color: '#4CAF50',
  },
  settingItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
  },
  settingText: {
    fontSize: 16,
  },
});
