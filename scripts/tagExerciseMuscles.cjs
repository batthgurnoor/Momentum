/**
 * One-off / repeatable: assigns muscleGroups to each row in exercise_data.json
 * by exact title. Run: node scripts/tagExerciseMuscles.cjs
 */
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'exercise_data.json');

/** @type {Record<string, string[]>} */
const TITLE_MUSCLES = {
  'Advanced jumping jacks': ['full_body', 'cardio'],
  'Backward lunge with front kick': ['quads', 'glutes', 'hamstrings', 'core'],
  'Chair leg squats': ['quads', 'glutes'],
  'Chair single leg squats': ['quads', 'glutes'],
  'Contralateral limb raises': ['core', 'glutes', 'back'],
  'Dead bugs': ['core'],
  'Donkey kicks': ['glutes', 'hamstrings'],
  'Fast step ups': ['quads', 'glutes', 'calves', 'cardio'],
  'Front kick plank': ['core', 'full_body'],
  'Lateral hops': ['calves', 'quads', 'cardio'],
  'Lunge with bicep curl': ['quads', 'glutes', 'biceps'],
  'Lunge with twist': ['quads', 'glutes', 'core'],
  'Mountain climber twists': ['core', 'shoulders', 'cardio'],
  'Plank push-ups': ['chest', 'triceps', 'shoulders', 'core'],
  'Press and plank': ['shoulders', 'triceps', 'core'],
  Rows: ['back', 'biceps'],
  'Russian twist': ['core'],
  'Shoulder push-up': ['shoulders', 'chest', 'triceps', 'core'],
  'Side lunges': ['quads', 'glutes'],
  'Side to side lunge with punches': ['quads', 'glutes', 'shoulders', 'core', 'cardio'],
  'Single leg deadlift': ['hamstrings', 'glutes', 'core'],
  'Sprinter sit-up': ['core'],
  'Squat floor reach': ['quads', 'glutes', 'hamstrings'],
  'Squat reach and jump': ['quads', 'glutes', 'full_body', 'cardio'],
  'Step up knee lifts': ['quads', 'glutes', 'core'],
  Superman: ['back', 'glutes'],
  'Supine bridge with leg extension': ['glutes', 'hamstrings', 'core'],
  'Three way arms': ['shoulders', 'biceps', 'triceps'],
  'Three way crunches': ['core'],
};

const data = JSON.parse(fs.readFileSync(file, 'utf8'));

for (const ex of data) {
  const mg = TITLE_MUSCLES[ex.title];
  if (!mg) {
    console.error('Missing muscle mapping for title:', JSON.stringify(ex.title));
    process.exit(1);
  }
  ex.muscleGroups = [...mg];
}

fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
console.log('Updated', data.length, 'exercises with muscleGroups.');
