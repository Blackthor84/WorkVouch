export interface Career {
  id: string;
  name: string;
  image: string;
  description: string;
}

export const careers: Career[] = [
  {
    id: 'developer',
    name: 'Software Developer',
    image: '/images/developer.png',
    description:
      'Build software, write clean code, and solve problems for businesses and users.'
  },
  {
    id: 'designer',
    name: 'Designer',
    image: '/images/designer.png',
    description:
      'Create beautiful interfaces, user experiences, and brand designs.'
  },
  {
    id: 'healthcare',
    name: 'Healthcare Professional',
    image: '/images/healthcare.png',
    description:
      'Provide compassionate care and improve patients\' quality of life.'
  },
  {
    id: 'teacher',
    name: 'Teacher',
    image: '/images/teacher.png',
    description:
      'Educate and inspire students, shaping the future one lesson at a time.'
  }
];
