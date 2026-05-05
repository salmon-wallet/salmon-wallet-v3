/**
 * ActionParamForm — presentational form for Solana Action `parameters[]`.
 *
 * Renders the right input per `ActionParameter.type` and exposes a synchronous
 * validity helper (`validateParameters`) so the host screen can gate its
 * Continue button. No fetch / no business logic — the host owns state.
 *
 * Validation here is a UX nicety, NOT a security boundary. Server-side
 * validation in Phase 3 is authoritative.
 */
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  colors,
  fontFamilyNative,
  fontSize,
  ms,
  s,
  spacing,
  vs,
} from '@salmon/shared';

export interface ActionParamFormParameter {
  name: string;
  label?: string;
  required?: boolean;
  type?:
    | 'text'
    | 'email'
    | 'url'
    | 'number'
    | 'date'
    | 'datetime-local'
    | 'checkbox'
    | 'radio'
    | 'textarea'
    | 'select';
  pattern?: string;
  patternDescription?: string;
  min?: number | string;
  max?: number | string;
  options?: Array<{ label: string; value: string; selected?: boolean }>;
}

export interface ActionParamFormProps {
  parameters: ActionParamFormParameter[];
  value: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
  disabled?: boolean;
}

export type ParamErrorCode = 'required' | 'pattern' | 'min' | 'max' | 'type';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, ParamErrorCode>;
}

function toNumber(v: number | string | undefined): number | undefined {
  if (v === undefined) return undefined;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function validateParameters(
  parameters: ActionParamFormParameter[],
  value: Record<string, string>,
): ValidationResult {
  const errors: Record<string, ParamErrorCode> = {};
  for (const p of parameters) {
    const raw = value[p.name];
    const isEmpty = raw === undefined || raw === '';
    if (isEmpty) {
      if (p.required) errors[p.name] = 'required';
      continue;
    }
    if (p.pattern) {
      try {
        const re = new RegExp(p.pattern);
        if (!re.test(raw)) {
          errors[p.name] = 'pattern';
          continue;
        }
      } catch {
        // invalid pattern — ignore (schema already filtered most of these)
      }
    }
    if (p.type === 'number') {
      const n = Number(raw);
      if (!Number.isFinite(n)) {
        errors[p.name] = 'type';
        continue;
      }
      const min = toNumber(p.min);
      const max = toNumber(p.max);
      if (min !== undefined && n < min) {
        errors[p.name] = 'min';
        continue;
      }
      if (max !== undefined && n > max) {
        errors[p.name] = 'max';
        continue;
      }
    }
  }
  return { isValid: Object.keys(errors).length === 0, errors };
}

function ParamLabel({ param }: { param: ActionParamFormParameter }) {
  const text = param.label ?? param.name;
  return (
    <Text style={styles.label}>
      {text}
      {param.required ? <Text style={styles.required}> *</Text> : null}
    </Text>
  );
}

interface FieldProps {
  param: ActionParamFormParameter;
  value: string;
  setValue: (next: string) => void;
  disabled?: boolean;
}

function TextField({ param, value, setValue, disabled }: FieldProps) {
  const a11yLabel = param.label ?? param.name;
  const keyboardType =
    param.type === 'number'
      ? ('numeric' as const)
      : param.type === 'email'
        ? ('email-address' as const)
        : param.type === 'url'
          ? ('url' as const)
          : ('default' as const);

  const placeholder =
    param.type === 'date'
      ? 'YYYY-MM-DD'
      : param.type === 'datetime-local'
        ? 'YYYY-MM-DDTHH:mm'
        : (param.patternDescription ?? '');

  return (
    <TextInput
      testID={`param-${param.name}`}
      accessibilityLabel={a11yLabel}
      value={value}
      onChangeText={setValue}
      editable={!disabled}
      keyboardType={keyboardType}
      autoCapitalize={
        param.type === 'email' || param.type === 'url' ? 'none' : 'sentences'
      }
      autoCorrect={param.type === 'email' || param.type === 'url' ? false : undefined}
      placeholder={placeholder}
      placeholderTextColor={colors.text.muted}
      multiline={param.type === 'textarea'}
      numberOfLines={param.type === 'textarea' ? 4 : 1}
      style={[styles.input, param.type === 'textarea' && styles.textarea]}
    />
  );
}

function CheckboxField({ param, value, setValue, disabled }: FieldProps) {
  const checked = value === 'true';
  return (
    <View style={styles.checkboxRow}>
      <ParamLabel param={param} />
      <Switch
        testID={`param-${param.name}`}
        accessibilityLabel={param.label ?? param.name}
        value={checked}
        onValueChange={(v) => setValue(v ? 'true' : 'false')}
        disabled={disabled}
      />
    </View>
  );
}

function OptionListField({ param, value, setValue, disabled }: FieldProps) {
  const { t } = useTranslation();
  const options = param.options ?? [];
  if (options.length === 0) {
    return (
      <Text style={styles.optionsWarning}>
        {t('blinks.detail.error.invalid_response')}
      </Text>
    );
  }
  return (
    <View style={styles.optionsContainer}>
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            testID={`param-${param.name}-option-${opt.value}`}
            accessibilityLabel={opt.label}
            disabled={disabled}
            onPress={() => setValue(opt.value)}
            style={[styles.optionPill, selected && styles.optionPillSelected]}
          >
            <Text
              style={[
                styles.optionLabel,
                selected && styles.optionLabelSelected,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function ActionParamForm({
  parameters,
  value,
  onChange,
  disabled,
}: ActionParamFormProps) {
  const handleChange = useCallback(
    (name: string, next: string) => onChange({ ...value, [name]: next }),
    [onChange, value],
  );

  return (
    <View style={styles.container}>
      {parameters.map((param) => {
        const v = value[param.name] ?? '';
        const setV = (next: string) => handleChange(param.name, next);
        if (param.type === 'checkbox') {
          return (
            <View key={param.name} style={styles.fieldRow}>
              <CheckboxField
                param={param}
                value={v}
                setValue={setV}
                disabled={disabled}
              />
            </View>
          );
        }
        if (param.type === 'radio' || param.type === 'select') {
          return (
            <View key={param.name} style={styles.fieldRow}>
              <ParamLabel param={param} />
              <OptionListField
                param={param}
                value={v}
                setValue={setV}
                disabled={disabled}
              />
            </View>
          );
        }
        return (
          <View key={param.name} style={styles.fieldRow}>
            <ParamLabel param={param} />
            <TextField
              param={param}
              value={v}
              setValue={setV}
              disabled={disabled}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  fieldRow: {
    marginBottom: vs(spacing.md),
  },
  label: {
    fontFamily: fontFamilyNative.medium,
    fontSize: ms(fontSize.sm),
    color: colors.text.primary,
    marginBottom: vs(spacing.xs),
  },
  required: {
    color: colors.text.muted,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: 12,
    paddingHorizontal: s(spacing.md),
    paddingVertical: vs(spacing.sm),
    fontFamily: fontFamilyNative.regular,
    fontSize: ms(fontSize.md),
    color: colors.text.primary,
  },
  textarea: {
    minHeight: vs(96),
    textAlignVertical: 'top',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(spacing.sm),
  },
  optionPill: {
    paddingHorizontal: s(spacing.md),
    paddingVertical: vs(spacing.sm),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  optionPillSelected: {
    backgroundColor: colors.text.primary,
    borderColor: colors.text.primary,
  },
  optionLabel: {
    fontFamily: fontFamilyNative.medium,
    fontSize: ms(fontSize.sm),
    color: colors.text.primary,
  },
  optionLabelSelected: {
    color: colors.background.primary,
  },
  optionsWarning: {
    fontFamily: fontFamilyNative.medium,
    fontSize: ms(fontSize.sm),
    color: colors.status.error,
  },
});
