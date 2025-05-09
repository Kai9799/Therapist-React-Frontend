import { Client } from '../contexts/ClientContext';

export const mockClients: Client[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    hobbies: ['Reading', 'Yoga', 'Gardening'],
    therapyType: 'Cognitive Behavioral Therapy',
    focusAreas: ['Anxiety', 'Work Stress', 'Self-esteem'],
    shortTermGoals: 'Develop coping strategies for workplace anxiety. Practice setting boundaries with colleagues.',
    longTermGoals: 'Build resilience to stress and develop a healthier work-life balance. Improve overall self-confidence.',
    notes: 'Sarah has been making good progress with her anxiety management techniques. She responds well to homework assignments and structured approaches.',
    lastSession: '2025-05-15',
    sessionHistory: [
      {
        id: '1',
        date: '2025-05-15',
        topic: 'Managing Workplace Anxiety',
        plan: {
          overview: 'Focus on developing coping strategies for workplace situations',
          structure: [
            { title: 'Check-in', duration: '10 minutes', description: 'Review of the week and current anxiety levels' }
          ]
        }
      },
      {
        id: '2',
        date: '2025-05-08',
        topic: 'Building Professional Boundaries',
        plan: {
          overview: 'Establishing healthy boundaries with colleagues',
          structure: [
            { title: 'Review', duration: '10 minutes', description: 'Discussion of current boundary challenges' }
          ]
        }
      }
    ],
    sessionNotes: [
      {
        id: '1',
        date: '2025-05-15',
        content: {
          overview: 'Client showed progress in implementing anxiety management techniques',
          keyTopics: ['Workplace triggers', 'Coping strategies', 'Progress review']
        }
      }
    ],
    resources: [
      {
        id: '1',
        date: '2025-05-15',
        title: 'Anxiety Management Worksheet',
        type: 'Worksheet',
        content: {
          purpose: 'Track and manage workplace anxiety triggers',
          sections: ['Trigger identification', 'Coping strategies', 'Progress tracking']
        }
      },
      {
        id: '2',
        date: '2025-05-08',
        title: 'Professional Boundaries Guide',
        type: 'Handout',
        content: {
          purpose: 'Guide for setting and maintaining professional boundaries',
          sections: ['Types of boundaries', 'Communication strategies', 'Practice scenarios']
        }
      }
    ]
  },
  {
    id: '2',
    name: 'Michael Chen',
    hobbies: ['Photography', 'Hiking', 'Cooking'],
    therapyType: 'Psychodynamic Therapy',
    focusAreas: ['Depression', 'Relationship Issues', 'Grief'],
    shortTermGoals: 'Process recent loss of parent. Identify patterns in relationships that contribute to feelings of isolation.',
    longTermGoals: 'Develop healthier attachment styles. Integrate grief into life narrative in a meaningful way.',
    notes: 'Michael has difficulty expressing emotions directly. He tends to intellectualize his experiences. Recent sessions have focused on connecting with underlying feelings.',
    lastSession: '2025-05-18'
  },
  {
    id: '3',
    name: 'Emma Wilson',
    hobbies: ['Running', 'Painting', 'Music'],
    therapyType: 'Family Therapy',
    focusAreas: ['Parenting Challenges', 'Communication', 'Blended Family Adjustment'],
    shortTermGoals: 'Establish consistent parenting approaches between households. Improve communication with teenage stepchildren.',
    longTermGoals: 'Create a cohesive family identity. Develop resilient family system that supports all members.',
    notes: 'Emma and her partner have been attending sessions together. They show good insight but struggle with implementation of strategies at home, particularly under stress.',
    lastSession: '2025-05-10'
  },
  {
    id: '4',
    name: 'James Rodriguez',
    hobbies: ['Guitar', 'Basketball', 'Writing'],
    therapyType: 'Integrative Therapy',
    focusAreas: ['Trauma Recovery', 'Substance Use', 'Identity'],
    shortTermGoals: 'Develop grounding techniques for flashbacks. Identify triggers for substance use.',
    longTermGoals: 'Process childhood trauma. Establish sustainable recovery practices. Explore and integrate aspects of identity.',
    notes: 'James has been sober for 3 months. He shows high motivation but can become overwhelmed by emotional content. Pacing is important.',
    lastSession: '2025-05-17'
  },
  {
    id: '5',
    name: 'Aisha Patel',
    hobbies: ['Chess', 'Swimming', 'Meditation'],
    therapyType: 'Cognitive Behavioral Therapy',
    focusAreas: ['OCD', 'Perfectionism', 'Academic Pressure'],
    shortTermGoals: 'Reduce time spent on checking behaviors. Challenge perfectionist standards for academic work.',
    longTermGoals: 'Develop flexible thinking patterns. Build self-worth independent of achievement.',
    notes: 'Aisha is highly engaged in therapy and completes homework consistently. She responds well to cognitive restructuring techniques but struggles with exposure exercises.',
    lastSession: '2025-05-12'
  }
];