import { View, Text } from 'react-native';
import React from 'react';

export function formatMuscleGroupLabel(key) {
  if (key == null || key === '') return '';
  return String(key)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * @param {{ muscleGroups?: string[] }} props
 */
export default function MuscleGroupsSection({ muscleGroups }) {
  if (!muscleGroups?.length) return null;

  return (
    <View className="mt-4">
      <Text className="text-xl font-semibold text-ui-text-primary">Muscles targeted</Text>
      <View className="flex-row flex-wrap mt-2">
        {muscleGroups.map((mg) => (
          <View
            key={mg}
            className="mr-2 mb-2 bg-ui-surface border border-momentum-border rounded-2xl px-3 py-1.5"
          >
            <Text className="text-primary font-medium">{formatMuscleGroupLabel(mg)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
