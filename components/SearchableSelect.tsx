import { Text } from '@/components/ui';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    TextInput,
    View,
} from 'react-native';

export interface SelectItem {
  id: string;
  label: string;
  subtitle?: string;
  points?: number;
}

interface SearchableSelectProps {
  value: SelectItem | null;
  onChange: (item: SelectItem | null) => void;
  placeholder?: string;
  /** Pre-filtered items to render in the list */
  items: SelectItem[];
  /** Controlled query string (shown in the search input) */
  query: string;
  /** Called when the search input changes */
  onQueryChange: (text: string) => void;
  isLoading?: boolean;
  /** Show a "type at least N chars" hint when query is shorter */
  minSearchLength?: number;
  disabled?: boolean;
}

export function SearchableSelect({
  value,
  onChange,
  placeholder = 'Select…',
  items,
  query,
  onQueryChange,
  isLoading = false,
  minSearchLength = 0,
  disabled = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);

  const handleOpen = useCallback(() => {
    if (!disabled) {
      onQueryChange('');
      setOpen(true);
    }
  }, [disabled, onQueryChange]);

  const handleClose = useCallback(() => {
    setOpen(false);
    onQueryChange('');
  }, [onQueryChange]);

  const handleSelect = useCallback(
    (item: SelectItem) => {
      onChange(item);
      setOpen(false);
      onQueryChange('');
    },
    [onChange, onQueryChange],
  );

  const handleClear = useCallback(() => {
    onChange(null);
    setOpen(false);
    onQueryChange('');
  }, [onChange, onQueryChange]);

  const showMinLengthHint = minSearchLength > 0 && query.length < minSearchLength;
  const showResults = !showMinLengthHint && !isLoading;
  const isEmpty = showResults && items.length === 0 && (minSearchLength === 0 || query.length >= minSearchLength);

  return (
    <>
      {/* Trigger button */}
      <Pressable
        onPress={handleOpen}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={value ? value.label : placeholder}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: value ? 'rgba(245,232,210,0.12)' : 'rgba(245,232,210,0.07)',
          backgroundColor: value ? 'rgba(245,232,210,0.06)' : 'rgba(245,232,210,0.03)',
          opacity: disabled ? 0.4 : 1,
        }}
      >
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            fontSize: 13,
            color: value ? 'rgba(245,232,210,0.9)' : 'rgba(245,232,210,0.35)',
          }}
        >
          {value ? value.label : placeholder}
        </Text>
        {value?.points !== undefined && (
          <View
            style={{
              marginLeft: 8,
              backgroundColor: 'rgba(216,107,61,0.15)',
              borderRadius: 999,
              paddingHorizontal: 8,
              paddingVertical: 2,
            }}
          >
            <Text style={{ fontSize: 10, color: '#D86B3D', fontVariant: ['tabular-nums'] }}>
              {value.points}
            </Text>
          </View>
        )}
        <Text
          style={{ marginLeft: 6, fontSize: 10, color: 'rgba(245,232,210,0.3)' }}
        >
          ▾
        </Text>
      </Pressable>

      {/* Bottom-sheet modal */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
        statusBarTranslucent
      >
        <Pressable
          onPress={handleClose}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, justifyContent: 'flex-end' }}
            pointerEvents="box-none"
          >
            {/* Stop taps on the sheet from closing the modal */}
            <Pressable
              onPress={() => undefined}
              style={{
                maxHeight: '72%',
                backgroundColor: '#181311',
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                overflow: 'hidden',
              }}
            >
              {/* Drag handle */}
              <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
                <View
                  style={{
                    width: 40,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: 'rgba(245,232,210,0.15)',
                  }}
                />
              </View>

              {/* Search input */}
              <View
                style={{
                  marginHorizontal: 16,
                  marginBottom: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(245,232,210,0.1)',
                  borderRadius: 12,
                  backgroundColor: 'rgba(245,232,210,0.05)',
                  paddingHorizontal: 12,
                }}
              >
                <TextInput
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    fontSize: 14,
                    color: 'rgba(245,232,210,0.9)',
                  }}
                  placeholder={
                    minSearchLength > 0
                      ? `Type at least ${minSearchLength} characters…`
                      : 'Search…'
                  }
                  placeholderTextColor="rgba(245,232,210,0.28)"
                  value={query}
                  onChangeText={onQueryChange}
                  autoFocus
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {isLoading && (
                  <ActivityIndicator size="small" color="rgba(216,107,61,0.8)" />
                )}
              </View>

              {/* Clear current selection */}
              {value !== null && (
                <Pressable
                  onPress={handleClear}
                  style={{
                    marginHorizontal: 16,
                    marginBottom: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: 'rgba(216,107,61,0.08)',
                    borderWidth: 1,
                    borderColor: 'rgba(216,107,61,0.2)',
                  }}
                >
                  <Text
                    numberOfLines={1}
                    style={{ flex: 1, fontSize: 13, color: '#D86B3D' }}
                  >
                    ✓ {value.label}
                  </Text>
                  <Text style={{ fontSize: 11, color: 'rgba(245,232,210,0.4)', marginLeft: 8 }}>
                    Clear
                  </Text>
                </Pressable>
              )}

              {/* Min-length hint */}
              {showMinLengthHint && (
                <View
                  style={{ marginHorizontal: 16, paddingVertical: 18, alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 12, color: 'rgba(245,232,210,0.35)' }}>
                    Type at least {minSearchLength} characters to search
                  </Text>
                </View>
              )}

              {/* Empty state */}
              {isEmpty && (
                <View
                  style={{ marginHorizontal: 16, paddingVertical: 18, alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 12, color: 'rgba(245,232,210,0.35)' }}>
                    No results
                  </Text>
                </View>
              )}

              {/* Loading state */}
              {isLoading && items.length === 0 && !showMinLengthHint && (
                <View
                  style={{ marginHorizontal: 16, paddingVertical: 18, alignItems: 'center' }}
                >
                  <ActivityIndicator size="small" color="rgba(216,107,61,0.6)" />
                </View>
              )}

              {/* Results list */}
              {showResults && items.length > 0 && (
                <FlatList
                  data={items}
                  keyExtractor={(item) => item.id}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 28 }}
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => handleSelect(item)}
                      style={[
                        {
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          borderRadius: 12,
                          marginBottom: 3,
                          borderWidth: 1,
                          borderColor: 'transparent',
                        },
                        item.id === value?.id
                          ? {
                              backgroundColor: 'rgba(216,107,61,0.08)',
                              borderColor: 'rgba(216,107,61,0.2)',
                            }
                          : {},
                      ]}
                    >
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text
                          numberOfLines={1}
                          style={{ fontSize: 13, color: 'rgba(245,232,210,0.9)' }}
                        >
                          {item.label}
                        </Text>
                        {item.subtitle !== undefined && (
                          <Text
                            numberOfLines={1}
                            style={{
                              fontSize: 11,
                              color: 'rgba(245,232,210,0.4)',
                              marginTop: 1,
                            }}
                          >
                            {item.subtitle}
                          </Text>
                        )}
                      </View>
                      {item.points !== undefined && (
                        <View
                          style={{
                            backgroundColor: 'rgba(216,107,61,0.15)',
                            borderRadius: 999,
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                          }}
                        >
                          <Text style={{ fontSize: 10, color: '#D86B3D' }}>
                            {item.points}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  )}
                />
              )}
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </>
  );
}
