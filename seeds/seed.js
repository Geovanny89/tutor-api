'use strict';

/**
 * Seed: Full 5-Block English Curriculum (A1 to C2)
 * Bloque 1: Cimientos de la Comunicación (Nivel A1) - 8 Módulos
 * Bloque 2: Entorno y Experiencias Simples (Nivel A2) - 8 Módulos
 * Bloque 3: Fluidez Cotidiana e Ideas Complejas (Nivel B1) - 8 Módulos
 * Bloque 4: Independencia y Argumentación (Nivel B2) - 8 Módulos
 * Bloque 5: Dominio Profesional y Matices (Nivel C1/C2) - 4 Módulos
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { sequelize, Module, Lesson, Evaluation, User, Tenant } = require('../src/models');
const { ROLES, LEVELS } = require('../src/config/constants');

const curriculum = [
  // ═══════════════════════════════════════════════════════════════════════════
  // BLOQUE 1: Cimientos de la Comunicación (Nivel A1)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    block: 1,
    level: 'A1',
    name: '1. El Alfabeto y Fonética Básica',
    description: 'Pronunciación de vocales y consonantes para deletrear nombres, emails y pronunciar correctamente.',
    icon: '🔤',
    color_from: '#059669',
    color_to: '#10B981',
    order_index: 0,
    evaluation: {
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice',
          question: 'How do you correctly spell the word "APPLE" in English?',
          options: ['A-P-L-E', 'A-P-P-L-E', 'A-P-E-L', 'E-P-P-L-E'],
          correct: 1,
          points: 50
        },
        {
          id: 'q2',
          type: 'speaking',
          question: 'Say: "I can spell my first name correctly."',
          expected_words: ['i', 'can', 'spell', 'my', 'first', 'name'],
          points: 50
        }
      ]
    },
    lessons: [
      {
        title: 'El Abecedario y Cómo Deletrear',
        subtitle: 'Las 26 letras y sus sonidos fonéticos clave',
        order_index: 0,
        content: {
          intro: { text: 'Aprenderemos a deletrear nombres y correos usando el alfabeto inglés.', audio_text: 'Let us learn the alphabet and how to spell names in English!' },
          vocabulary: [
            { word: 'Spell', pronunciation: 'spel', translation: 'Deletrear', example: 'How do you spell your name?' },
            { word: 'First name', pronunciation: 'first neim', translation: 'Nombre de pila', example: 'My first name is David.' },
            { word: 'Last name', pronunciation: 'last neim', translation: 'Apellido', example: 'My last name is Miller.' },
            { word: 'Email address', pronunciation: 'ii-meil a-dres', translation: 'Correo electrónico', example: 'What is your email address?' },
          ],
          dialogue: [
            { speaker: 'Gema', text: 'Hello! How do you spell your first name?', translation: '¡Hola! ¿Cómo deletreas tu primer nombre?' },
            { speaker: 'Student', text: 'It is J-O-H-N. John.', translation: 'Es J-O-H-N. John.' },
          ],
          grammar: {
            rule: 'Preguntar cómo se deletrea: "How do you spell...?"',
            explanation: 'Se usa para pedir que alguien deletree una palabra letra por letra.',
            examples: [{ sentence: 'How do you spell your city?', translation: '¿Cómo deletreas tu ciudad?' }],
          },
          practice: [{ type: 'speaking', instruction: 'Say: "How do you spell your last name?"', expected_words: ['how', 'spell', 'last', 'name'] }],
        },
      },
    ],
  },
  {
    block: 1,
    level: 'A1',
    name: '2. Sustantivos y Pronombres Personales',
    description: 'I, you, he, she, it, we, they y los sustantivos básicos para formar el sujeto de la oración.',
    icon: '👥',
    color_from: '#059669',
    color_to: '#10B981',
    order_index: 1,
    evaluation: {
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice',
          question: 'Which pronoun do we use for a group of people including yourself?',
          options: ['They', 'We', 'You', 'He'],
          correct: 1,
          points: 50
        },
        {
          id: 'q2',
          type: 'speaking',
          question: 'Say: "We are students and she is our teacher."',
          expected_words: ['we', 'are', 'students', 'she', 'teacher'],
          points: 50
        }
      ]
    },
    lessons: [
      {
        title: 'Los Pronombres de Sujeto en Inglés',
        subtitle: 'I, you, he, she, it, we, they',
        order_index: 0,
        content: {
          intro: { text: 'En inglés nunca se omite el sujeto. Descubre cómo usar cada pronombre correctamente.', audio_text: 'I, you, he, she, it, we, they. Subject pronouns are always necessary!' },
          vocabulary: [
            { word: 'I', pronunciation: 'ai', translation: 'Yo', example: 'I am here.' },
            { word: 'He / She', pronunciation: 'ji / shi', translation: 'Él / Ella', example: 'He is my brother and she is my sister.' },
            { word: 'It', pronunciation: 'it', translation: 'Eso / Ello (cosas o animales)', example: 'It is a new car.' },
            { word: 'We / They', pronunciation: 'ui / dei', translation: 'Nosotros / Ellos', example: 'We are friends and they are coworkers.' },
          ],
          dialogue: [
            { speaker: 'Gema', text: 'Who are they?', translation: '¿Quiénes son ellos?' },
            { speaker: 'Student', text: 'They are my colleagues from work.', translation: 'Ellos son mis compañeros de trabajo.' },
          ],
          grammar: {
            rule: 'El pronombre "I" (yo) siempre se escribe en mayúscula',
            explanation: 'No importa si está al inicio o en medio de una oración, "I" siempre va con mayúscula.',
            examples: [{ sentence: 'You and I are learning English.', translation: 'Tú y yo estamos aprendiendo inglés.' }],
          },
          practice: [{ type: 'speaking', instruction: 'Say: "We are students and she is my friend."', expected_words: ['we', 'are', 'students', 'she', 'friend'] }],
        },
      },
    ],
  },
  {
    block: 1,
    level: 'A1',
    name: '3. El Verbo To Be (Presente)',
    description: 'Afirmativo, negativo e interrogativo: I am, I am not, Are you? para ser y estar.',
    icon: '⚡',
    color_from: '#059669',
    color_to: '#10B981',
    order_index: 2,
    evaluation: {
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice',
          question: 'What is the correct negative form of "She is ready"?',
          options: ['She not is ready', 'She are not ready', 'She isn\'t ready', 'She am not ready'],
          correct: 2,
          points: 50
        },
        {
          id: 'q2',
          type: 'speaking',
          question: 'Say: "I am a student and I am not tired."',
          expected_words: ['i', 'am', 'student', 'not', 'tired'],
          points: 50
        }
      ]
    },
    lessons: [
      {
        title: 'AM, IS, ARE: Afirmativo, Negativo y Preguntas',
        subtitle: 'Domina el verbo más importante del idioma inglés',
        order_index: 0,
        content: {
          intro: { text: 'El verbo To Be significa ser o estar. Aprende sus 3 formas en afirmativo, negativo y pregunta.', audio_text: 'I am happy, she is not tired, are you ready? The verb To Be in action!' },
          vocabulary: [
            { word: 'I am / I\'m', pronunciation: 'aim', translation: 'Yo soy / Yo estoy', example: 'I am ready.' },
            { word: 'Is not / Isn\'t', pronunciation: 'iz-nt', translation: 'No es / No está', example: 'He isn\'t at work.' },
            { word: 'Are not / Aren\'t', pronunciation: 'arnt', translation: 'No son / No están', example: 'They aren\'t late.' },
            { word: 'Are you...?', pronunciation: 'ar yu', translation: '¿Eres tú...? / ¿Estás tú...?', example: 'Are you ready to practice?' },
          ],
          dialogue: [
            { speaker: 'Gema', text: 'Are you ready for English class today?', translation: '¿Estás listo para la clase de inglés hoy?' },
            { speaker: 'Student', text: 'Yes, I am! I am excited to practice.', translation: '¡Sí, lo estoy! Estoy emocionado de practicar.' },
          ],
          grammar: {
            rule: 'Inversión en preguntas con To Be: Verbo + Sujeto',
            explanation: 'En afirmación dices "You are ready". En pregunta inviertes a "¿Are you ready?".',
            examples: [{ sentence: 'Is she your teacher? Yes, she is.', translation: '¿Es ella tu profesora? Sí, lo es.' }],
          },
          practice: [{ type: 'speaking', instruction: 'Say: "Are you ready? Yes, I am ready!"', expected_words: ['are', 'you', 'ready', 'yes', 'i', 'am'] }],
        },
      },
    ],
  },
  {
    block: 1,
    level: 'A1',
    name: '4. Artículos y Demostrativos',
    description: 'A, an, the / This, that, these, those para señalar y nombrar objetos con precisión.',
    icon: '📦',
    color_from: '#059669',
    color_to: '#10B981',
    order_index: 3,
    evaluation: {
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice',
          question: 'When do we use "AN" instead of "A"?',
          options: ['Before a consonant sound', 'Before a vowel sound', 'Only for plural objects', 'For objects that are far away'],
          correct: 1,
          points: 50
        },
        {
          id: 'q2',
          type: 'speaking',
          question: 'Say: "This is an apple and those are my keys."',
          expected_words: ['this', 'is', 'an', 'apple', 'those', 'are', 'keys'],
          points: 50
        }
      ]
    },
    lessons: [
      {
        title: 'A vs AN y This / That / These / Those',
        subtitle: 'Singular, plural, cerca y lejos',
        order_index: 0,
        content: {
          intro: { text: 'Aprende cuándo usar A vs AN y cómo señalar cosas con This, That, These y Those.', audio_text: 'An apple, a book, this phone, that car over there.' },
          vocabulary: [
            { word: 'A / An', pronunciation: 'ei / an', translation: 'Un / Una', example: 'A car, an orange.' },
            { word: 'This / That', pronunciation: 'dis / dat', translation: 'Este (cerca) / Ese (lejos)', example: 'This is my bag, that is your car.' },
            { word: 'These / Those', pronunciation: 'diiz / douz', translation: 'Estos (cerca) / Esos (lejos)', example: 'These are my keys, those are stars.' },
          ],
          dialogue: [
            { speaker: 'Gema', text: 'Is this your jacket?', translation: '¿Es esta tu chaqueta?' },
            { speaker: 'Student', text: 'No, that jacket over there is mine.', translation: 'No, aquella chaqueta de allá es la mía.' },
          ],
          grammar: {
            rule: 'Usa AN antes de sonido vocal y A antes de consonante',
            explanation: 'Guíate por el sonido: "an apple", "an hour" (la h no suena), pero "a university" (suena como yu).',
            examples: [{ sentence: 'This is an interesting book.', translation: 'Este es un libro interesante.' }],
          },
          practice: [{ type: 'speaking', instruction: 'Say: "This is my phone and that is your book."', expected_words: ['this', 'phone', 'that', 'book'] }],
        },
      },
    ],
  },
  {
    block: 1,
    level: 'A1',
    name: '5. Presente Simple (Do / Does)',
    description: 'Estructura de rutinas, hábitos y hechos generales con auxiliares Do y Does.',
    icon: '🏃',
    color_from: '#059669',
    color_to: '#10B981',
    order_index: 4,
    evaluation: {
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice',
          question: 'Which auxiliary verb do we use for questions with "She" in the Present Simple?',
          options: ['Do', 'Does', 'Is', 'Are'],
          correct: 1,
          points: 50
        },
        {
          id: 'q2',
          type: 'speaking',
          question: 'Say: "She works every day and she speaks English well."',
          expected_words: ['works', 'every', 'day', 'speaks', 'english'],
          points: 50
        }
      ]
    },
    lessons: [
      {
        title: 'Rutinas y la Regla de la Tercera Persona',
        subtitle: 'He works, She drinks, Do you speak...?',
        order_index: 0,
        content: {
          intro: { text: 'El Presente Simple describe tus hábitos. Con He, She e It añadimos una -S al verbo.', audio_text: 'I work every day, but she works from home. Do you like coffee?' },
          vocabulary: [
            { word: 'To work', pronunciation: 'tu uork', translation: 'Trabajar', example: 'I work in marketing.' },
            { word: 'To live', pronunciation: 'tu liv', translation: 'Vivir', example: 'He lives in Canada.' },
            { word: 'Do you...?', pronunciation: 'du yu', translation: '¿Tú...?', example: 'Do you drink coffee?' },
            { word: 'Doesn\'t', pronunciation: 'daz-nt', translation: 'Él/Ella no...', example: 'She doesn\'t eat meat.' },
          ],
          dialogue: [
            { speaker: 'Gema', text: 'Do you work in an office or from home?', translation: '¿Trabajas en una oficina o desde casa?' },
            { speaker: 'Student', text: 'I work from home, and my sister works at a hospital.', translation: 'Trabajo desde casa y mi hermana trabaja en un hospital.' },
          ],
          grammar: {
            rule: 'Tercera persona singular agrega -S en afirmación',
            explanation: 'I work -> She works. En preguntas y negaciones usamos DOES / DOESN\'T y el verbo queda normal.',
            examples: [{ sentence: 'Does he speak English? Yes, he does.', translation: '¿Habla él inglés? Sí, habla.' }],
          },
          practice: [{ type: 'speaking', instruction: 'Say: "Do you speak English? Yes, I speak English every day."', expected_words: ['do', 'you', 'speak', 'english', 'every', 'day'] }],
        },
      },
    ],
  },
  {
    block: 1,
    level: 'A1',
    name: '6. Pronombres y Adjetivos Posesivos',
    description: 'My, your, his, her, our, their / Mine, yours, hers para indicar posesión clara.',
    icon: '🔑',
    color_from: '#059669',
    color_to: '#10B981',
    order_index: 5,
    evaluation: {
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice',
          question: 'What is the possessive adjective for "WE"?',
          options: ['Our', 'Their', 'Your', 'My'],
          correct: 0,
          points: 50
        },
        {
          id: 'q2',
          type: 'speaking',
          question: 'Say: "This is my house and that is their car."',
          expected_words: ['this', 'my', 'house', 'that', 'their', 'car'],
          points: 50
        }
      ]
    },
    lessons: [
      {
        title: 'Adjetivos Posesivos y Posesivo \'S',
        subtitle: 'My car, your house, John\'s office',
        order_index: 0,
        content: {
          intro: { text: 'Aprende a indicar a quién pertenece cada cosa usando My, Your, His, Her y el posesivo \'S.', audio_text: 'This is my book and that is Beyli\'s computer. Is this bag yours?' },
          vocabulary: [
            { word: 'My / Your', pronunciation: 'mai / yur', translation: 'Mi / Tu', example: 'My car, your turn.' },
            { word: 'His / Her', pronunciation: 'jiz / jer', translation: 'Su (de él) / Su (de ella)', example: 'His dog, her passport.' },
            { word: 'Our / Their', pronunciation: 'aur / der', translation: 'Nuestro / Su (de ellos)', example: 'Our team, their project.' },
            { word: 'Mine / Yours', pronunciation: 'main / yurz', translation: 'Mío / Tuyo', example: 'The decision is yours.' },
          ],
          dialogue: [
            { speaker: 'Gema', text: 'Whose car is that outside?', translation: '¿De quién es ese carro afuera?' },
            { speaker: 'Student', text: 'That is my brother\'s car. Mine is parked in the garage.', translation: 'Ese es el carro de mi hermano. El mío está estacionado en el garaje.' },
          ],
          grammar: {
            rule: 'El posesivo \'S con personas: [Nombre]\'s + objeto',
            explanation: 'En inglés se pone el dueño primero con \'s: "Carlos\'s laptop" o "my mother\'s house".',
            examples: [{ sentence: 'This is Gema\'s notebook.', translation: 'Este es el cuaderno de Gema.' }],
          },
          practice: [{ type: 'speaking', instruction: 'Say: "This is my laptop and that is her phone."', expected_words: ['this', 'my', 'laptop', 'that', 'her', 'phone'] }],
        },
      },
    ],
  },
  {
    block: 1,
    level: 'A1',
    name: '7. Presente Continuo o Progresivo',
    description: 'Acciones que ocurren en el momento exacto: Subject + to be + verb -ing (I am speaking).',
    icon: '⏳',
    color_from: '#059669',
    color_to: '#10B981',
    order_index: 6,
    lessons: [
      {
        title: 'Estructura To Be + Verbo -ING',
        subtitle: 'Habla de lo que estás haciendo justo ahora',
        order_index: 0,
        content: {
          intro: { text: 'El Presente Continuo describe lo que pasa en este momento: I am speaking, you are listening.', audio_text: 'What are you doing right now? I am learning English!' },
          vocabulary: [
            { word: 'Right now / At the moment', pronunciation: 'rait nau / at de mou-ment', translation: 'Justo ahora / En este momento', example: 'I am studying right now.' },
            { word: 'Speaking', pronunciation: 'spii-king', translation: 'Hablando', example: 'She is speaking to the manager.' },
            { word: 'Listening', pronunciation: 'lis-ning', translation: 'Escuchando', example: 'We are listening carefully.' },
            { word: 'Learning', pronunciation: 'ler-ning', translation: 'Aprendiendo', example: 'They are learning fast.' },
          ],
          dialogue: [
            { speaker: 'Gema', text: 'What are you doing right now?', translation: '¿Qué estás haciendo ahora mismo?' },
            { speaker: 'Student', text: 'I am practicing my English speaking with you!', translation: '¡Estoy practicando mi conversación en inglés contigo!' },
          ],
          grammar: {
            rule: 'Sujeto + AM/IS/ARE + Verbo terminado en -ING',
            explanation: 'Para acciones temporales en progreso: "I am working", "He is driving", "They are studying".',
            examples: [{ sentence: 'It is raining outside right now.', translation: 'Está lloviendo afuera ahora mismo.' }],
          },
          practice: [{ type: 'speaking', instruction: 'Say: "I am learning English and you are helping me."', expected_words: ['i', 'am', 'learning', 'english', 'helping'] }],
        },
      },
    ],
  },
  {
    block: 1,
    level: 'A1',
    name: '8. Estructuras de Pregunta Básicas (Sí/No y Wh-)',
    description: 'Preguntas de confirmación y partículas Wh- (What, Who, Where, When, Why, How).',
    icon: '❓',
    color_from: '#059669',
    color_to: '#10B981',
    order_index: 7,
    lessons: [
      {
        title: 'Las 6 Preguntas WH Indispensables',
        subtitle: 'What, Who, Where, When, Why, How',
        order_index: 0,
        content: {
          intro: { text: 'Para comunicarte con éxito necesitas saber preguntar. Estas 6 palabras son la clave.', audio_text: 'What, who, where, when, why, and how. Ask questions with confidence!' },
          vocabulary: [
            { word: 'What', pronunciation: 'uot', translation: 'Qué / Cuál', example: 'What is your goal?' },
            { word: 'Where', pronunciation: 'uer', translation: 'Dónde', example: 'Where do you live?' },
            { word: 'When', pronunciation: 'uen', translation: 'Cuándo', example: 'When do you start?' },
            { word: 'Who', pronunciation: 'juu', translation: 'Quién', example: 'Who is your teacher?' },
            { word: 'Why', pronunciation: 'uai', translation: 'Por qué', example: 'Why are you learning English?' },
            { word: 'How', pronunciation: 'jau', translation: 'Cómo', example: 'How are you today?' },
          ],
          dialogue: [
            { speaker: 'Gema', text: 'Where do you live and why do you learn English?', translation: '¿Dónde vives y por qué aprendes inglés?' },
            { speaker: 'Student', text: 'I live in Colombia and I learn English because I want a better job.', translation: 'Vivo en Colombia y aprendo inglés porque quiero un mejor trabajo.' },
          ],
          grammar: {
            rule: 'Estructura: Partícula WH + Auxiliar (Do/Is/Are) + Sujeto + Verbo?',
            explanation: 'Ejemplo: "Where (Wh) do (aux) you (sujeto) live (verbo)?"',
            examples: [{ sentence: 'What do you do for a living?', translation: '¿A qué te dedicas?' }],
          },
          practice: [{ type: 'speaking', instruction: 'Say: "Where do you live and what do you do?"', expected_words: ['where', 'do', 'you', 'live', 'what'] }],
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BLOQUE 2: Entorno y Experiencias Simples (Nivel A2)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    block: 2,
    level: 'A2',
    name: '1. Pasado Simple (Verbo To Be)',
    description: 'Was y Were para expresar pasado de ser y estar (I was in Paris, they were happy).',
    icon: '🏛️',
    color_from: '#059669',
    color_to: '#10B981',
    order_index: 8,
    lessons: [
      {
        title: 'Was y Were en Afirmación, Negación y Pregunta',
        subtitle: 'Fui, era, estuve y estaba',
        order_index: 0,
        content: {
          intro: { text: 'Aprende a hablar de dónde estuviste o cómo fue una experiencia en el pasado.', audio_text: 'I was, you were, he was, we were. Let us talk about yesterday!' },
          vocabulary: [
            { word: 'Yesterday', pronunciation: 'yes-ter-dei', translation: 'Ayer', example: 'I was tired yesterday.' },
            { word: 'Last week', pronunciation: 'last uiik', translation: 'La semana pasada', example: 'Were you in the office last week?' },
            { word: 'Wasn\'t / Weren\'t', pronunciation: 'uaz-nt / uernt', translation: 'No era / No estaba', example: 'They weren\'t ready.' },
          ],
          dialogue: [
            { speaker: 'Gema', text: 'Where were you yesterday afternoon?', translation: '¿Dónde estuviste ayer en la tarde?' },
            { speaker: 'Student', text: 'I was at the gym and then I was at home.', translation: 'Estuve en el gimnasio y luego estuve en casa.' },
          ],
          grammar: {
            rule: 'Was (I, He, She, It) | Were (You, We, They)',
            explanation: 'En preguntas inviertes: "Were you happy?". Negativo: "I wasn\'t tired".',
            examples: [{ sentence: 'The concert was fantastic!', translation: '¡El concierto estuvo fantástico!' }],
          },
          practice: [{ type: 'speaking', instruction: 'Say: "I was at home yesterday and it was sunny."', expected_words: ['i', 'was', 'home', 'yesterday', 'sunny'] }],
        },
      },
    ],
  },
  {
    block: 2,
    level: 'A2',
    name: '2. Pasado Simple (Verbos Regulares e Irregulares)',
    description: 'Terminación -ed y los verbos irregulares clave (Went, Had, Saw) con el auxiliar DID.',
    icon: '📜',
    color_from: '#059669',
    color_to: '#10B981',
    order_index: 9,
    lessons: [
      {
        title: 'Verbos con -ED, Irregulares y Auxiliar DID',
        subtitle: 'I played, I went, Did you see...?',
        order_index: 0,
        content: {
          intro: { text: 'Aprende a narrar sucesos pasados con verbos regulares e irregulares.', audio_text: 'I visited my family, went shopping, and bought a gift.' },
          vocabulary: [
            { word: 'Went (Go)', pronunciation: 'uent', translation: 'Fui / Fue', example: 'I went to New York.' },
            { word: 'Had (Have)', pronunciation: 'jad', translation: 'Tuve / Tenía', example: 'We had dinner together.' },
            { word: 'Did / Didn\'t', pronunciation: 'did / did-nt', translation: 'Auxiliar de pasado', example: 'Did you like it? I didn\'t go.' },
          ],
          dialogue: [
            { speaker: 'Gema', text: 'What did you do last weekend?', translation: '¿Qué hiciste el fin de semana pasado?' },
            { speaker: 'Student', text: 'I visited my friends and we watched a movie.', translation: 'Visité a mis amigos y vimos una película.' },
          ],
          grammar: {
            rule: 'Con DID y DIDN\'T el verbo principal vuelve a su forma base',
            explanation: 'Correcto: "Did you go?", NUNCA "Did you went". Negativo: "I didn\'t buy".',
            examples: [{ sentence: 'Did you finish the report? Yes, I did.', translation: '¿Terminaste el informe? Sí, lo terminé.' }],
          },
          practice: [{ type: 'speaking', instruction: 'Say: "Yesterday I went to the store and I bought coffee."', expected_words: ['yesterday', 'went', 'store', 'bought', 'coffee'] }],
        },
      },
    ],
  },
  {
    block: 2,
    level: 'A2',
    name: '3. Pasado Continuo',
    description: 'Acciones en progreso o interrumpidas en el pasado (I was sleeping when the phone rang).',
    icon: '📞',
    color_from: '#059669',
    color_to: '#10B981',
    order_index: 10,
    lessons: [
      {
        title: 'Was/Were + -ING y Acciones Interrumpidas (When)',
        subtitle: 'I was driving when it started raining',
        order_index: 0,
        content: {
          intro: { text: 'Usa el Pasado Continuo para describir qué estabas haciendo cuando otra acción ocurrió.', audio_text: 'I was walking in the park when I met my best friend.' },
          vocabulary: [
            { word: 'While', pronunciation: 'uail', translation: 'Mientras', example: 'While I was working, he called.' },
            { word: 'When', pronunciation: 'uen', translation: 'Cuando', example: 'I was sleeping when the alarm rang.' },
          ],
          dialogue: [
            { speaker: 'Gema', text: 'What were you doing when the lights went out?', translation: '¿Qué estabas haciendo cuando se fue la luz?' },
            { speaker: 'Student', text: 'I was cooking dinner in the kitchen.', translation: 'Estaba cocinando la cena en la cocina.' },
          ],
          grammar: {
            rule: 'Pasado Continuo (acción larga) + When + Pasado Simple (interrupción)',
            explanation: 'Ejemplo: "I was reading (largo) when she arrived (interrupción)".',
            examples: [{ sentence: 'They were talking when the boss entered.', translation: 'Ellos estaban hablando cuando entró el jefe.' }],
          },
          practice: [{ type: 'speaking', instruction: 'Say: "I was cooking when my friend called me."', expected_words: ['i', 'was', 'cooking', 'when', 'friend', 'called'] }],
        },
      },
    ],
  },
  {
    block: 2,
    level: 'A2',
    name: '4. Sustantivos Contables e Incontables',
    description: 'Cuantificadores: Much, many, some, any, a lot of para cantidades y compras.',
    icon: '🛒',
    color_from: '#059669',
    color_to: '#10B981',
    order_index: 11,
    lessons: [
      {
        title: 'Much, Many, Some, Any y A Lot Of',
        subtitle: 'Cómo hablar de comida, dinero, tiempo y cantidades',
        order_index: 0,
        content: {
          intro: { text: 'Aprende a diferenciar sustantivos que puedes contar (apples) de los que no (water, time, money).', audio_text: 'How much water do you drink? How many books do you read?' },
          vocabulary: [
            { word: 'How much...?', pronunciation: 'jau mach', translation: '¿Cuánto/a? (incontables)', example: 'How much coffee do you want?' },
            { word: 'How many...?', pronunciation: 'jau me-ni', translation: '¿Cuántos/as? (contables)', example: 'How many people are here?' },
            { word: 'Some / Any', pronunciation: 'sam / e-ni', translation: 'Algo de / Ningún', example: 'I have some apples. Do you have any milk?' },
          ],
          dialogue: [
            { speaker: 'Gema', text: 'How many cups of coffee do you drink a day?', translation: '¿Cuántas tazas de café tomas al día?' },
            { speaker: 'Student', text: 'I drink two cups, and I drink a lot of water.', translation: 'Tomo dos tazas y tomo mucha agua.' },
          ],
          grammar: {
            rule: 'Many con plurales contables | Much con incontables',
            explanation: 'Some se usa en frases afirmativas ("I need some help"). Any se usa en preguntas y negativas.',
            examples: [{ sentence: 'We don\'t have any sugar.', translation: 'No tenemos nada de azúcar.' }],
          },
          practice: [{ type: 'speaking', instruction: 'Say: "I have some money and I drink a lot of water."', expected_words: ['i', 'have', 'some', 'money', 'drink', 'water'] }],
        },
      },
    ],
  },
  {
    block: 2,
    level: 'A2',
    name: '5. Adverbios de Frecuencia',
    description: 'Always, usually, often, sometimes, never y su posición exacta en la oración.',
    icon: '🔄',
    color_from: '#059669',
    color_to: '#10B981',
    order_index: 12,
    lessons: [
      {
        title: 'Always, Usually, Sometimes y Never',
        subtitle: 'Dónde colocarlos en tus oraciones cotidianas',
        order_index: 0,
        content: {
          intro: { text: 'Los adverbios de frecuencia indican con qué periodicidad haces una actividad.', audio_text: 'I always wake up early, I usually exercise, and I never skip breakfast.' },
          vocabulary: [
            { word: 'Always (100%)', pronunciation: 'ool-ueiz', translation: 'Siempre', example: 'I always read at night.' },
            { word: 'Usually (80%)', pronunciation: 'yuu-zhua-li', translation: 'Usualmente', example: 'She usually drinks tea.' },
            { word: 'Sometimes (50%)', pronunciation: 'sam-taimz', translation: 'A veces', example: 'We sometimes go out.' },
            { word: 'Never (0%)', pronunciation: 'ne-ver', translation: 'Nunca', example: 'I never smoke.' },
          ],
          dialogue: [
            { speaker: 'Gema', text: 'Do you usually practice English in the morning?', translation: '¿Usualmente practicas inglés por la mañana?' },
            { speaker: 'Student', text: 'I always practice in the evening after work.', translation: 'Siempre practico en la tarde después del trabajo.' },
          ],
          grammar: {
            rule: 'Se colocan ANTES del verbo principal, pero DESPUÉS del verbo To Be',
            explanation: 'Ejemplo: "I always (adverbio) study (verbo)". Pero: "I am (To Be) always (adverbio) happy".',
            examples: [{ sentence: 'He is never late for meetings.', translation: 'Él nunca llega tarde a las reuniones.' }],
          },
          practice: [{ type: 'speaking', instruction: 'Say: "I always practice English and I usually drink coffee."', expected_words: ['always', 'practice', 'english', 'usually', 'coffee'] }],
        },
      },
    ],
  },
  {
    block: 2,
    level: 'A2',
    name: '6. Adjetivos Comparativos y Superlativos',
    description: 'Tall / taller / the tallest; beautiful / more beautiful / the most beautiful.',
    icon: '⚖️',
    color_from: '#059669',
    color_to: '#10B981',
    order_index: 13,
    lessons: [
      {
        title: 'Comparar Personas, Lugares y Objetos (Than & The Most)',
        subtitle: 'Reglas para adjetivos cortos (-er) y largos (more)',
        order_index: 0,
        content: {
          intro: { text: 'Aprende a comparar cosas: más rápido que (faster than) y el más rápido (the fastest).', audio_text: 'Canada is bigger than Spain, but Russia is the biggest country.' },
          vocabulary: [
            { word: 'Faster than', pronunciation: 'fas-ter dan', translation: 'Más rápido que', example: 'A plane is faster than a train.' },
            { word: 'More expensive than', pronunciation: 'mor eks-pen-siv dan', translation: 'Más caro que', example: 'This watch is more expensive.' },
            { word: 'The best / The worst', pronunciation: 'de best / de uorst', translation: 'El mejor / El peor (irregulares)', example: 'You are the best!' },
          ],
          dialogue: [
            { speaker: 'Gema', text: 'Which city is bigger: Tokyo or Madrid?', translation: '¿Qué ciudad es más grande: Tokio o Madrid?' },
            { speaker: 'Student', text: 'Tokyo is much bigger than Madrid.', translation: 'Tokio es mucho más grande que Madrid.' },
          ],
          grammar: {
            rule: 'Adjetivo corto: +ER + than | Adjetivo largo: MORE + adjetivo + than',
            explanation: 'Tall -> taller than. Beautiful -> more beautiful than. Good -> better than (irregular).',
            examples: [{ sentence: 'English is easier than you think!', translation: '¡El inglés es más fácil de lo que crees!' }],
          },
          practice: [{ type: 'speaking', instruction: 'Say: "This city is bigger and more beautiful than that one."', expected_words: ['city', 'bigger', 'more', 'beautiful', 'than'] }],
        },
      },
    ],
  },
  {
    block: 2,
    level: 'A2',
    name: '7. Futuro con Going To',
    description: 'Planes e intenciones seguras a corto y mediano plazo (I am going to travel next month).',
    icon: '🎯',
    color_from: '#059669',
    color_to: '#10B981',
    order_index: 14,
    lessons: [
      {
        title: 'Be Going To + Verbo Base',
        subtitle: 'Habla con seguridad de tus planes y metas',
        order_index: 0,
        content: {
          intro: { text: 'Usa "going to" cuando ya tomaste una decisión sobre el futuro.', audio_text: 'What are you going to do this weekend? I am going to relax!' },
          vocabulary: [
            { word: 'I am going to...', pronunciation: 'aim gou-ing tu', translation: 'Voy a...', example: 'I am going to visit my parents.' },
            { word: 'Tomorrow', pronunciation: 'tu-mo-rou', translation: 'Mañana', example: 'We are going to start tomorrow.' },
            { word: 'Next month', pronunciation: 'nekst manz', translation: 'El próximo mes', example: 'She is going to move next month.' },
          ],
          dialogue: [
            { speaker: 'Gema', text: 'What are you going to do this weekend?', translation: '¿Qué vas a hacer este fin de semana?' },
            { speaker: 'Student', text: 'I am going to study English and travel to the beach.', translation: 'Voy a estudiar inglés y viajar a la playa.' },
          ],
          grammar: {
            rule: 'Sujeto + AM/IS/ARE + going to + verbo base',
            explanation: 'Ejemplo: "She is going to buy a car", "We are going to celebrate".',
            examples: [{ sentence: 'Are you going to watch the game tonight?', translation: '¿Vas a ver el partido esta noche?' }],
          },
          practice: [{ type: 'speaking', instruction: 'Say: "I am going to study English every day this month."', expected_words: ['going', 'study', 'english', 'every', 'day'] }],
        },
      },
    ],
  },
  {
    block: 2,
    level: 'A2',
    name: '8. Preposiciones de Lugar y Tiempo (In, On, At)',
    description: 'La pirámide de In, On, At: en fechas, horas, meses, calles y lugares específicos.',
    icon: '📍',
    color_from: '#059669',
    color_to: '#10B981',
    order_index: 15,
    lessons: [
      {
        title: 'Dominando IN, ON, AT para Tiempo y Espacio',
        subtitle: 'At 5 PM, on Monday, in July; at home, on the street, in the city',
        order_index: 0,
        content: {
          intro: { text: 'In (general), On (más específico), At (punto exacto). Aplica esta regla y nunca fallarás.', audio_text: 'At 8 o\'clock, on Friday, in 2026. The pyramid rule!' },
          vocabulary: [
            { word: 'At (hora / punto exacto)', pronunciation: 'at', translation: 'A las / En', example: 'At 7:00 AM, at school.' },
            { word: 'On (días / fechas / superficies)', pronunciation: 'on', translation: 'El (día) / Sobre', example: 'On Monday, on the table.' },
            { word: 'In (meses / años / ciudades)', pronunciation: 'in', translation: 'En', example: 'In December, in Madrid.' },
          ],
          dialogue: [
            { speaker: 'Gema', text: 'When is your English exam?', translation: '¿Cuándo es tu examen de inglés?' },
            { speaker: 'Student', text: 'It is on Friday at three o\'clock in the afternoon.', translation: 'Es el viernes a las tres en punto de la tarde.' },
          ],
          grammar: {
            rule: 'AT = horas y lugares precisos | ON = días de la semana y fechas | IN = meses, años y ciudades',
            explanation: 'At 3:00 PM, on Monday, on July 4th, in December, in Colombia.',
            examples: [{ sentence: 'We will meet at the airport on Sunday.', translation: 'Nos encontraremos en el aeropuerto el domingo.' }],
          },
          practice: [{ type: 'speaking', instruction: 'Say: "I wake up at seven on Mondays in the morning."', expected_words: ['wake', 'at', 'seven', 'on', 'mondays'] }],
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BLOQUE 3: Fluidez Cotidiana e Ideas Complejas (Nivel B1)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    block: 3,
    level: 'B1',
    name: '1. Presente Perfecto Simple',
    description: 'Have/Has + Pasado Participio y marcadores (Already, yet, just, ever, never) para experiencias.',
    icon: '✨',
    color_from: '#059669',
    color_to: '#10B981',
    order_index: 16,
    lessons: [
      {
        title: 'Have/Has + Participio Pasado y Marcadores Clave',
        subtitle: 'Have you ever...? I have already finished!',
        order_index: 0,
        content: {
          intro: { text: 'El Presente Perfecto conecta el pasado con el presente para hablar de experiencias de vida.', audio_text: 'Have you ever been to London? Yes, I have visited twice!' },
          vocabulary: [
            { word: 'Have you ever...?', pronunciation: 'jav yu e-ver', translation: '¿Alguna vez has...?', example: 'Have you ever flown in a plane?' },
            { word: 'Already', pronunciation: 'ool-re-di', translation: 'Ya', example: 'I have already finished my work.' },
            { word: 'Yet', pronunciation: 'yet', translation: 'Aún / Todavía', example: 'Have you eaten yet? Not yet.' },
            { word: 'Just', pronunciation: 'dzhast', translation: 'Acabo de...', example: 'I have just arrived.' },
          ],
          dialogue: [
            { speaker: 'Gema', text: 'Have you ever traveled to an English-speaking country?', translation: '¿Alguna vez has viajado a un país de habla inglesa?' },
            { speaker: 'Student', text: 'No, I haven\'t yet, but I have already planned my trip!', translation: 'No, todavía no, ¡pero ya he planeado mi viaje!' },
          ],
          grammar: {
            rule: 'Have / Has + Verbo en Participio Pasado (3ra columna)',
            explanation: 'Ever se usa en preguntas ("Have you ever...?"). Never para negar ("I have never eaten sushi").',
            examples: [{ sentence: 'She has lived here for five years.', translation: 'Ella ha vivido aquí por cinco años.' }],
          },
          practice: [{ type: 'speaking', instruction: 'Say: "I have already finished my lesson and I have just started practicing."', expected_words: ['have', 'already', 'finished', 'just', 'started'] }],
        },
      },
    ],
  },
  {
    block: 3,
    level: 'B1',
    name: '2. Presente Perfecto vs. Pasado Simple',
    description: 'Cuándo especificar el tiempo cronológico exacto (yesterday, in 2020) y cuándo no.',
    icon: '⚖️',
    color_from: '#059669',
    color_to: '#10B981',
    order_index: 17,
    lessons: [
      {
        title: 'Tiempo Definido vs. Tiempo Indefinido',
        subtitle: 'I went to Rome in 2022 vs I have been to Rome',
        order_index: 0,
        content: {
          intro: { text: 'Si dices CUÁNDO ocurrió (yesterday, last year), usas Pasado Simple. Si hablas de experiencia sin fecha, usas Presente Perfecto.', audio_text: 'Did you go last year, or have you been there before?' },
          vocabulary: [
            { word: 'In 2020 (tiempo cerrado)', pronunciation: 'in tuen-ti tuen-ti', translation: 'En 2020', example: 'I bought this in 2020 (Pasado).' },
            { word: 'So far (tiempo abierto)', pronunciation: 'sou far', translation: 'Hasta ahora', example: 'I have read 3 books so far (Presente Perfecto).' },
          ],
          dialogue: [
            { speaker: 'Gema', text: 'Have you seen the new movie?', translation: '¿Has visto la nueva película?' },
            { speaker: 'Student', text: 'Yes! I saw it on Friday with my friends.', translation: '¡Sí! La vi el viernes con mis amigos.' },
          ],
          grammar: {
            rule: 'Si hay marca de tiempo cerrada (yesterday, ago, last), USA PASADO SIMPLE',
            explanation: '"I saw her yesterday" (Correcto). "I have seen her yesterday" (Incorrecto).',
            examples: [{ sentence: 'I have lost my keys (no las tengo ahora). I lost my keys yesterday, but found them.', translation: 'Perdí mis llaves.' }],
          },
          practice: [{ type: 'speaking', instruction: 'Say: "I have visited France, and I went there last summer."', expected_words: ['have', 'visited', 'went', 'last', 'summer'] }],
        },
      },
    ],
  },
  {
    block: 3,
    level: 'B1',
    name: '3. Futuro con Will',
    description: 'Decisiones espontáneas, predicciones y promesas (I will help you, it will rain).',
    icon: '🔮',
    color_from: '#059669',
    color_to: '#10B981',
    order_index: 18,
    lessons: [
      {
        title: 'Will vs Going To: Decisiones en el Momento y Promesas',
        subtitle: 'I\'ll do it right now! I promise I will be there.',
        order_index: 0,
        content: {
          intro: { text: 'Will se usa para decisiones que tomas en el mismo instante de hablar o para promesas y predicciones.', audio_text: 'The phone is ringing. I will answer it! I will always support you.' },
          vocabulary: [
            { word: 'I\'ll (I will)', pronunciation: 'ail', translation: 'Yo haré / Yo voy a...', example: 'I\'ll call you in five minutes.' },
            { word: 'Won\'t (will not)', pronunciation: 'uount', translation: 'No...', example: 'I won\'t let you down.' },
            { word: 'I promise', pronunciation: 'ai pro-mis', translation: 'Lo prometo', example: 'I will be there, I promise.' },
          ],
          dialogue: [
            { speaker: 'Gema', text: 'It is very cold in here.', translation: 'Hace mucho frío aquí adentro.' },
            { speaker: 'Student', text: 'I will close the window for you right away.', translation: 'Cerraré la ventana por ti enseguida.' },
          ],
          grammar: {
            rule: 'Sujeto + WILL + Verbo en forma base (sin To)',
            explanation: 'Negación: Won\'t. Para ofrecimientos espontáneos en el instante siempre usamos Will.',
            examples: [{ sentence: 'I think it will be sunny tomorrow.', translation: 'Creo que estará soleado mañana.' }],
          },
          practice: [{ type: 'speaking', instruction: 'Say: "I will call you tomorrow and I will help you with that."', expected_words: ['will', 'call', 'tomorrow', 'help'] }],
        },
      },
    ],
  },
  {
    block: 3,
    level: 'B1',
    name: '4. Verbos Modales de Habilidad y Permiso',
    description: 'Can, could, be able to para expresar lo que eres capaz de hacer o pedir permiso.',
    icon: '🦸',
    color_from: '#059669',
    color_to: '#10B981',
    order_index: 19,
    lessons: [
      {
        title: 'Can, Could y Be Able To',
        subtitle: 'Habilidad presente, pasada y futura',
        order_index: 0,
        content: {
          intro: { text: 'Aprende a expresar talento, habilidad y solicitar permiso de forma educada.', audio_text: 'I can speak two languages, could you help me, please?' },
          vocabulary: [
            { word: 'I can', pronunciation: 'ai kan', translation: 'Puedo', example: 'I can swim very well.' },
            { word: 'Could you...?', pronunciation: 'kud yu', translation: '¿Podrías...?', example: 'Could you repeat that, please?' },
            { word: 'Be able to', pronunciation: 'bi ei-bel tu', translation: 'Ser capaz de', example: 'I will be able to speak fluent English.' },
          ],
          dialogue: [
            { speaker: 'Gema', text: 'Could you tell me how many languages you can speak?', translation: '¿Podrías decirme cuántos idiomas puedes hablar?' },
            { speaker: 'Student', text: 'I can speak Spanish fluently, and now I can speak English!', translation: '¡Puedo hablar español con fluidez y ahora puedo hablar inglés!' },
          ],
          grammar: {
            rule: 'Los modales van seguidos del verbo en forma base (sin To)',
            explanation: '"I can swim", NUNCA "I can to swim". Could es más formal y cortés que Can.',
            examples: [{ sentence: 'Could you send me the document, please?', translation: '¿Podrías enviarme el documento, por favor?' }],
          },
          practice: [{ type: 'speaking', instruction: 'Say: "I can speak English and I will be able to travel anywhere."', expected_words: ['can', 'speak', 'english', 'able', 'travel'] }],
        },
      },
    ],
  },
  {
    block: 3,
    level: 'B1',
    name: '5. Verbos Modales de Obligación y Consejo',
    description: 'Must, have to, should para recomendaciones, reglas y obligaciones profesionales.',
    icon: '📋',
    color_from: '#059669',
    color_to: '#10B981',
    order_index: 20,
    lessons: [
      {
        title: 'Should (Consejo) vs Must / Have To (Obligación)',
        subtitle: 'You should rest; you have to wear a seatbelt',
        order_index: 0,
        content: {
          intro: { text: 'Aprende a dar consejos (Should) y a expresar reglas necesarias (Must / Have to).', audio_text: 'You should practice every day, and you have to be consistent!' },
          vocabulary: [
            { word: 'You should', pronunciation: 'yu shud', translation: 'Deberías (consejo)', example: 'You should sleep 8 hours.' },
            { word: 'Have to', pronunciation: 'jav tu', translation: 'Tener que (necesidad/ley)', example: 'I have to finish this report.' },
            { word: 'Must', pronunciation: 'mast', translation: 'Deber (obligación fuerte)', example: 'You must show your ID.' },
          ],
          dialogue: [
            { speaker: 'Gema', text: 'I feel very tired today.', translation: 'Me siento muy cansada hoy.' },
            { speaker: 'Student', text: 'You should take a break and drink some water.', translation: 'Deberías tomar un descanso y beber algo de agua.' },
          ],
          grammar: {
            rule: 'Should = Consejo amigable | Have to = Obligación externa',
            explanation: 'Don\'t have to significa que NO es necesario ("You don\'t have to pay").',
            examples: [{ sentence: 'You should watch movies in English.', translation: 'Deberías ver películas en inglés.' }],
          },
          practice: [{ type: 'speaking', instruction: 'Say: "You should practice speaking and you have to listen carefully."', expected_words: ['should', 'practice', 'speaking', 'have', 'listen'] }],
        },
      },
    ],
  },
  {
    block: 3,
    level: 'B1',
    name: '6. Condicional Cero y Primer Condicional',
    description: 'Hechos lógicos y situaciones reales futuras (If + present, ... will + verb).',
    icon: '⚡',
    color_from: '#059669',
    color_to: '#10B981',
    order_index: 21,
    lessons: [
      {
        title: 'If + Presente -> Futuro con Will',
        subtitle: 'If you study, you will pass the exam',
        order_index: 0,
        content: {
          intro: { text: 'Aprende a plantear causas y consecuencias reales en el futuro usando IF.', audio_text: 'If you practice every day, you will speak English fluently.' },
          vocabulary: [
            { word: 'If', pronunciation: 'if', translation: 'Si (condición)', example: 'If it rains, we will stay home.' },
            { word: 'Unless', pronunciation: 'an-les', translation: 'A menos que', example: 'Unless you hurry, we will be late.' },
          ],
          dialogue: [
            { speaker: 'Gema', text: 'What will happen if you practice 15 minutes every day?', translation: '¿Qué pasará si practicas 15 minutos cada día?' },
            { speaker: 'Student', text: 'If I practice every day, I will master conversational English!', translation: '¡Si practico todos los días, dominaré el inglés conversacional!' },
          ],
          grammar: {
            rule: 'If + Present Simple, Sujeto + WILL + Verbo',
            explanation: 'NUNCA pongas Will en la cláusula de If: "If you study (presente), you will pass (futuro)".',
            examples: [{ sentence: 'If I have time tomorrow, I will call you.', translation: 'Si tengo tiempo mañana, te llamaré.' }],
          },
          practice: [{ type: 'speaking', instruction: 'Say: "If I practice every day, I will speak fluent English."', expected_words: ['if', 'practice', 'every', 'day', 'fluent', 'english'] }],
        },
      },
    ],
  },
  {
    block: 3,
    level: 'B1',
    name: '7. Segundo Condicional (Hipotético)',
    description: 'Situaciones imaginarias o deseadas (If I won the lottery, I would buy a house).',
    icon: '💭',
    color_from: '#059669',
    color_to: '#10B981',
    order_index: 22,
    lessons: [
      {
        title: 'If + Pasado -> Would + Verbo',
        subtitle: 'If I had more time, I would travel around the world',
        order_index: 0,
        content: {
          intro: { text: 'El Segundo Condicional se usa para soñar despierto o hablar de cosas hipotéticas.', audio_text: 'If I had a million dollars, I would travel everywhere. What would you do?' },
          vocabulary: [
            { word: 'Would', pronunciation: 'uud', translation: 'Terminación -ría', example: 'I would like that.' },
            { word: 'If I were you...', pronunciation: 'if ai uer yu', translation: 'Si yo fuera tú...', example: 'If I were you, I would take the job.' },
          ],
          dialogue: [
            { speaker: 'Gema', text: 'What would you do if you won the lottery?', translation: '¿Qué harías si ganaras la lotería?' },
            { speaker: 'Student', text: 'If I won the lottery, I would buy a house and travel the world.', translation: 'Si ganara la lotería, compraría una casa y viajaría por el mundo.' },
          ],
          grammar: {
            rule: 'If + Pasado Simple, Sujeto + WOULD + Verbo Base',
            explanation: 'Con el verbo To Be, tradicionalmente se usa "were" con todos los sujetos: "If I were you".',
            examples: [{ sentence: 'If I lived in London, I would speak English every day.', translation: 'Si viviera en Londres, hablaría inglés todos los días.' }],
          },
          practice: [{ type: 'speaking', instruction: 'Say: "If I had more time, I would travel around the world."', expected_words: ['if', 'had', 'time', 'would', 'travel', 'world'] }],
        },
      },
    ],
  },
  {
    block: 3,
    level: 'B1',
    name: '8. Gerundios e Infinitivos',
    description: 'Identificar qué verbos van seguidos de -ING y cuáles de TO (enjoy reading vs want to go).',
    icon: '🎯',
    color_from: '#059669',
    color_to: '#10B981',
    order_index: 23,
    lessons: [
      {
        title: 'Verbos Seguidos de Gerundio (-ing) vs Infinitivo (to)',
        subtitle: 'I enjoy swimming, I decide to go',
        order_index: 0,
        content: {
          intro: { text: 'Algunos verbos exigen -ing (enjoy, avoid, mind) y otros exigen to (want, need, decide, hope).', audio_text: 'I want to speak English, and I really enjoy learning it!' },
          vocabulary: [
            { word: 'Want to / Need to', pronunciation: 'uant tu / niid tu', translation: 'Querer / Necesitar (+ to)', example: 'I want to travel.' },
            { word: 'Enjoy / Love (+ ing)', pronunciation: 'en-dzhoy', translation: 'Disfrutar (+ ing)', example: 'I enjoy reading novels.' },
          ],
          dialogue: [
            { speaker: 'Gema', text: 'Do you enjoy studying languages?', translation: '¿Disfrutas estudiar idiomas?' },
            { speaker: 'Student', text: 'Yes, I enjoy practicing speaking, and I want to become fluent.', translation: '¡Sí, disfruto practicar conversación y quiero volverme fluido!' },
          ],
          grammar: {
            rule: 'Después de preposiciones, el verbo SIEMPRE lleva -ING',
            explanation: '"I am interested in (prep) learning (ing) English".',
            examples: [{ sentence: 'Thank you for (prep) helping (ing) me.', translation: 'Gracias por ayudarme.' }],
          },
          practice: [{ type: 'speaking', instruction: 'Say: "I want to improve my skills and I enjoy learning English."', expected_words: ['want', 'improve', 'skills', 'enjoy', 'learning'] }],
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BLOQUE 4: Independencia y Argumentación (Nivel B2)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    block: 4,
    level: 'B2',
    name: '1. Pasado Perfecto',
    description: 'La acción que ocurrió antes de otra acción en el pasado (Had + past participle).',
    icon: '🕰️',
    color_from: '#059669',
    color_to: '#10B981',
    order_index: 24,
    lessons: [
      {
        title: 'El Pasado del Pasado: Had + Participio',
        subtitle: 'When I arrived, the train had already left',
        order_index: 0,
        content: {
          intro: { text: 'El Pasado Perfecto aclara el orden cronológico de dos eventos pasados.', audio_text: 'By the time the meeting started, I had already reviewed the presentation.' },
          vocabulary: [
            { word: 'Had already', pronunciation: 'jad ool-re-di', translation: 'Ya había...', example: 'I had already seen that movie.' },
            { word: 'By the time...', pronunciation: 'bai de taim', translation: 'Para cuando...', example: 'By the time he called, I had left.' },
          ],
          dialogue: [
            { speaker: 'Gema', text: 'Did you catch the bus this morning?', translation: '¿Alcanzaste el autobús esta mañana?' },
            { speaker: 'Student', text: 'No, when I arrived at the station, the bus had already departed.', translation: 'No, cuando llegué a la estación el bus ya había partido.' },
          ],
          grammar: {
            rule: 'Had + Participio Pasado para la acción más antigua',
            explanation: 'Acción 1 (más vieja): Had left. Acción 2 (más reciente): Arrived.',
            examples: [{ sentence: 'She had finished her degree before she moved abroad.', translation: 'Ella había terminado su carrera antes de mudarse al extranjero.' }],
          },
          practice: [{ type: 'speaking', instruction: 'Say: "When I arrived, the meeting had already started."', expected_words: ['when', 'arrived', 'meeting', 'had', 'already', 'started'] }],
        },
      },
    ],
  },
  {
    block: 4,
    level: 'B2',
    name: '2. Voz Pasiva',
    description: 'Enfocar la oración en el objeto o resultado y no en el sujeto activo (The report was written).',
    icon: '📰',
    color_from: '#059669',
    color_to: '#10B981',
    order_index: 25,
    lessons: [
      {
        title: 'Estructura de la Voz Pasiva (To Be + Participio)',
        subtitle: 'The software was developed, millions of cars are produced',
        order_index: 0,
        content: {
          intro: { text: 'Usa la voz pasiva en contextos formales, noticias y reportes de trabajo.', audio_text: 'The new feature was released last week by the engineering team.' },
          vocabulary: [
            { word: 'Was built / Was created', pronunciation: 'uaz bilt', translation: 'Fue construido / creado', example: 'The app was created in 2024.' },
            { word: 'Are required', pronunciation: 'ar ri-kuaird', translation: 'Son requeridos', example: 'Passwords are required.' },
          ],
          dialogue: [
            { speaker: 'Gema', text: 'Was the new system implemented successfully?', translation: '¿Fue implementado el nuevo sistema con éxito?' },
            { speaker: 'Student', text: 'Yes, it was thoroughly tested and deployed yesterday.', translation: '¡Sí, fue probado exhaustivamente y desplegado ayer!' },
          ],
          grammar: {
            rule: 'Objeto + Verbo To Be (en cualquier tiempo) + Participio Pasado',
            explanation: 'Activa: "Steve Jobs founded Apple". Pasiva: "Apple was founded by Steve Jobs".',
            examples: [{ sentence: 'English is spoken all over the world.', translation: 'El inglés es hablado en todo el mundo.' }],
          },
          practice: [{ type: 'speaking', instruction: 'Say: "The project was completed on time and approved by the team."', expected_words: ['project', 'was', 'completed', 'time', 'approved'] }],
        },
      },
    ],
  },
  {
    block: 4,
    level: 'B2',
    name: '3. Estilo Indirecto (Reported Speech)',
    description: 'Cómo reportar lo que otra persona dijo cambiando los tiempos verbales hacia el pasado.',
    icon: '🗣️',
    color_from: '#059669',
    color_to: '#10B981',
    order_index: 26,
    lessons: [
      {
        title: 'He said that... / She told me that...',
        subtitle: 'Cómo reportar conversaciones y reuniones',
        order_index: 0,
        content: {
          intro: { text: 'Aprende a reportar lo que otros dijeron en reuniones de trabajo o charlas cotidianas.', audio_text: 'She told me that she was busy, and he said that he would join us later.' },
          vocabulary: [
            { word: 'Said that', pronunciation: 'sed dat', translation: 'Dijo que', example: 'He said that he was ready.' },
            { word: 'Told me that', pronunciation: 'tould mi dat', translation: 'Me dijo que', example: 'She told me that she liked the idea.' },
          ],
          dialogue: [
            { speaker: 'Gema', text: 'What did the manager say about our proposal?', translation: '¿Qué dijo el gerente sobre nuestra propuesta?' },
            { speaker: 'Student', text: 'She said that she had reviewed it and liked the strategy.', translation: 'Dijo que la había revisado y que le gustó la estrategia.' },
          ],
          grammar: {
            rule: 'Los tiempos verbales dan un salto hacia el pasado (backshift)',
            explanation: 'Presente -> Pasado. Will -> Would. Can -> Could.',
            examples: [{ sentence: 'He said: "I am ready" -> He said that he was ready.', translation: 'Dijo que estaba listo.' }],
          },
          practice: [{ type: 'speaking', instruction: 'Say: "She told me that she would attend the meeting tomorrow."', expected_words: ['she', 'told', 'would', 'attend', 'meeting'] }],
        },
      },
    ],
  },
  {
    block: 4,
    level: 'B2',
    name: '4. Tercer Condicional',
    description: 'Hipótesis sobre eventos pasados que ya no se pueden cambiar (If I had studied, I would have passed).',
    icon: '⏪',
    color_from: '#059669',
    color_to: '#10B981',
    order_index: 27,
    lessons: [
      {
        title: 'If + Pasado Perfecto -> Would Have + Participio',
        subtitle: 'Lamentos, lecciones aprendidas y realidades alternativas',
        order_index: 0,
        content: {
          intro: { text: 'El Tercer Condicional analiza qué habría pasado si hubiéramos actuado diferente en el pasado.', audio_text: 'If I had known earlier, I would have taken a different decision.' },
          vocabulary: [
            { word: 'Would have', pronunciation: 'uud jav', translation: 'Habría...', example: 'I would have called you.' },
            { word: 'Could have', pronunciation: 'kud jav', translation: 'Podría haber...', example: 'We could have won.' },
          ],
          dialogue: [
            { speaker: 'Gema', text: 'Why didn\'t you attend the conference?', translation: '¿Por qué no asististe a la conferencia?' },
            { speaker: 'Student', text: 'If I had known about the event, I would have registered immediately.', translation: 'Si hubiera sabido del evento, me habría registrado inmediatamente.' },
          ],
          grammar: {
            rule: 'If + had + participio, Sujeto + would have + participio',
            explanation: 'Expresa algo imposible porque el pasado ya ocurrió.',
            examples: [{ sentence: 'If we had left earlier, we would not have missed the flight.', translation: 'Si hubiéramos salido más temprano, no habríamos perdido el vuelo.' }],
          },
          practice: [{ type: 'speaking', instruction: 'Say: "If I had known, I would have prepared much better."', expected_words: ['if', 'had', 'known', 'would', 'prepared', 'better'] }],
        },
      },
    ],
  },
  {
    block: 4,
    level: 'B2',
    name: '5. Oraciones de Relativo (Relative Clauses)',
    description: 'Uso de conectores para definir o añadir información (Who, which, that, whose, where).',
    icon: '🔗',
    color_from: '#059669',
    color_to: '#10B981',
    order_index: 28,
    lessons: [
      {
        title: 'Who, Which, That, Whose y Where',
        subtitle: 'Conecta dos ideas en una sola oración fluida y natural',
        order_index: 0,
        content: {
          intro: { text: 'Las Relative Clauses unen ideas sin repetir el sujeto, haciendo tu discurso mucho más profesional.', audio_text: 'The professional who helped me, the project which we launched.' },
          vocabulary: [
            { word: 'Who', pronunciation: 'juu', translation: 'Quien / Que (personas)', example: 'The teacher who inspired me.' },
            { word: 'Which / That', pronunciation: 'uich / dat', translation: 'El cual / Que (cosas)', example: 'The book that I bought.' },
            { word: 'Whose', pronunciation: 'juuz', translation: 'Cuyo / Cuya', example: 'The client whose company is growing.' },
          ],
          dialogue: [
            { speaker: 'Gema', text: 'Can you introduce me to the person who designed this platform?', translation: '¿Puedes presentarme a la persona que diseñó esta plataforma?' },
            { speaker: 'Student', text: 'Sure! She is an engineer who has worked in tech for ten years.', translation: '¡Claro! Ella es una ingeniera que ha trabajado en tecnología por diez años.' },
          ],
          grammar: {
            rule: 'Who para personas | Which para cosas | That para ambos en cláusulas definitorias',
            explanation: 'Evita repeticiones innecesarias y da fluidez nativa.',
            examples: [{ sentence: 'This is the city where I was born.', translation: 'Esta es la ciudad donde nací.' }],
          },
          practice: [{ type: 'speaking', instruction: 'Say: "She is the colleague who helped me finish the project."', expected_words: ['she', 'colleague', 'who', 'helped', 'finish', 'project'] }],
        },
      },
    ],
  },
  {
    block: 4,
    level: 'B2',
    name: '6. Modales Perfectos',
    description: 'Expresar deducción lógica o arrepentimiento en el pasado: Should have, must have, could have.',
    icon: '💡',
    color_from: '#059669',
    color_to: '#10B981',
    order_index: 29,
    lessons: [
      {
        title: 'Should Have, Must Have y Could Have',
        subtitle: 'You should have told me! He must have been exhausted.',
        order_index: 0,
        content: {
          intro: { text: 'Aprende a deducir el pasado con certeza o a expresar que algo debió hacerse diferente.', audio_text: 'You should have called me earlier. He must have forgotten his keys.' },
          vocabulary: [
            { word: 'Should have', pronunciation: 'shud jav', translation: 'Debió haber...', example: 'I should have studied more.' },
            { word: 'Must have', pronunciation: 'mast jav', translation: 'Debe haber... (certeza)', example: 'He must have arrived by now.' },
            { word: 'Can\'t have', pronunciation: 'kant jav', translation: 'Imposible que haya...', example: 'She can\'t have said that!' },
          ],
          dialogue: [
            { speaker: 'Gema', text: 'Why is David late for the meeting?', translation: '¿Por qué llega tarde David a la reunión?' },
            { speaker: 'Student', text: 'He must have been stuck in heavy traffic.', translation: 'Debe haberse quedado atrapado en un tráfico pesado.' },
          ],
          grammar: {
            rule: 'Modal + HAVE + Participio Pasado',
            explanation: '"Should have done" = arrepentimiento o consejo pasado. "Must have been" = deducción lógica.',
            examples: [{ sentence: 'We could have won if we had scored that goal.', translation: 'Podríamos haber ganado si hubiéramos anotado ese gol.' }],
          },
          practice: [{ type: 'speaking', instruction: 'Say: "I should have known that and he must have arrived by now."', expected_words: ['should', 'have', 'known', 'must', 'arrived'] }],
        },
      },
    ],
  },
  {
    block: 4,
    level: 'B2',
    name: '7. Phrasal Verbs Esenciales',
    description: 'Verbos compuestos por una raíz y preposición que transforman su significado (Get over, look up to).',
    icon: '⚡',
    color_from: '#059669',
    color_to: '#10B981',
    order_index: 30,
    lessons: [
      {
        title: 'Los Phrasal Verbs más Usados por Nativos',
        subtitle: 'Get along, look forward to, give up, find out, turn down',
        order_index: 0,
        content: {
          intro: { text: 'Los hablantes nativos usan phrasal verbs en el 70% de sus conversaciones cotidianas.', audio_text: 'Never give up! I look forward to hearing your ideas.' },
          vocabulary: [
            { word: 'Look forward to', pronunciation: 'luk for-uard tu', translation: 'Esperar con ansias', example: 'I look forward to meeting you.' },
            { word: 'Give up', pronunciation: 'giv ap', translation: 'Rendirse', example: 'Don\'t give up on your dreams.' },
            { word: 'Find out', pronunciation: 'faind aut', translation: 'Descubrir / Enterarse', example: 'Let us find out the truth.' },
            { word: 'Get along with', pronunciation: 'get a-long uid', translation: 'Llevarse bien con', example: 'I get along with my team.' },
          ],
          dialogue: [
            { speaker: 'Gema', text: 'Are you looking forward to your upcoming vacation?', translation: '¿Esperas con ansias tus próximas vacaciones?' },
            { speaker: 'Student', text: 'Yes, I am really looking forward to traveling and relaxing!', translation: '¡Sí, realmente espero con ansias viajar y relajarme!' },
          ],
          grammar: {
            rule: 'Muchos phrasal verbs son inseparables o requieren objeto después de la preposición',
            explanation: '"Look forward to" siempre va seguido de sustantivo o verbo en -ING: "looking forward to meeting you".',
            examples: [{ sentence: 'We must find out how to solve this issue.', translation: 'Debemos averiguar cómo resolver este problema.' }],
          },
          practice: [{ type: 'speaking', instruction: 'Say: "I look forward to our meeting and I will never give up."', expected_words: ['look', 'forward', 'meeting', 'never', 'give'] }],
        },
      },
    ],
  },
  {
    block: 4,
    level: 'B2',
    name: '8. Conectores de Discurso Avanzados',
    description: 'However, furthermore, although, despite, whereas para argumentar y debatir.',
    icon: '🧱',
    color_from: '#059669',
    color_to: '#10B981',
    order_index: 31,
    lessons: [
      {
        title: 'Contrastes y Argumentación Sofisticada',
        subtitle: 'Although, however, on the other hand, in addition',
        order_index: 0,
        content: {
          intro: { text: 'Los conectores elevan tu inglés de simple a elocuente y persuasivo.', audio_text: 'Although it was challenging, we achieved outstanding results.' },
          vocabulary: [
            { word: 'However', pronunciation: 'jau-e-ver', translation: 'Sin embargo', example: 'The plan is good; however, it is costly.' },
            { word: 'Although / Even though', pronunciation: 'ool-dou', translation: 'Aunque', example: 'Although it rained, we enjoyed the day.' },
            { word: 'Furthermore / In addition', pronunciation: 'fer-der-mor', translation: 'Además / Es más', example: 'Furthermore, the data is verified.' },
            { word: 'Despite / In spite of', pronunciation: 'di-spait', translation: 'A pesar de (+ sustantivo/ing)', example: 'Despite the obstacles, we succeeded.' },
          ],
          dialogue: [
            { speaker: 'Gema', text: 'What is your perspective on remote work?', translation: '¿Cuál es tu perspectiva sobre el trabajo remoto?' },
            { speaker: 'Student', text: 'Although it increases productivity, it can sometimes reduce personal interaction.', translation: 'Aunque aumenta la productividad, a veces puede reducir la interacción personal.' },
          ],
          grammar: {
            rule: 'Despite + Sustantivo o Gerundio (-ING) | Although + Oración completa con verbo',
            explanation: '"Despite the rain (sustantivo)" vs "Although it rained (oración)".',
            examples: [{ sentence: 'Furthermore, we should invest in continuous learning.', translation: 'Además, deberíamos invertir en aprendizaje continuo.' }],
          },
          practice: [{ type: 'speaking', instruction: 'Say: "Although it was difficult, we achieved great success."', expected_words: ['although', 'difficult', 'achieved', 'great', 'success'] }],
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BLOQUE 5: Dominio Profesional y Matices (Nivel C1/C2)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    block: 5,
    level: 'C1',
    name: '1. Inversión Gramatical',
    description: 'Estructuras formales de alta elocuencia para dar énfasis (Seldom have I seen, Not only did he...).',
    icon: '👑',
    color_from: '#059669',
    color_to: '#10B981',
    order_index: 32,
    lessons: [
      {
        title: 'Inversión Retórica para Énfasis',
        subtitle: 'Seldom, rarely, hardly, not only... but also',
        order_index: 0,
        content: {
          intro: { text: 'La inversión estilística coloca palabras negativas al frente para dar un impacto retórico de alto nivel.', audio_text: 'Seldom have I witnessed such dedication. Not only did they win, but they also broke the record.' },
          vocabulary: [
            { word: 'Seldom / Rarely', pronunciation: 'sel-dom / rer-li', translation: 'Raras veces', example: 'Seldom have I encountered such talent.' },
            { word: 'Not only... but also', pronunciation: 'not oun-li', translation: 'No solo... sino también', example: 'Not only did he succeed, but he also inspired others.' },
          ],
          dialogue: [
            { speaker: 'Gema', text: 'How was the keynote presentation at the summit?', translation: '¿Cómo estuvo la conferencia magistral en la cumbre?' },
            { speaker: 'Student', text: 'Rarely have I seen an audience so deeply engaged and inspired.', translation: 'Rara vez he visto a una audiencia tan profundamente cautivada e inspirada.' },
          ],
          grammar: {
            rule: 'Adverbio Negativo + Auxiliar + Sujeto + Verbo (Estructura tipo pregunta)',
            explanation: 'En lugar de "I have seldom seen", inviertes: "Seldom have I seen".',
            examples: [{ sentence: 'Under no circumstances should you disclose this information.', translation: 'Bajo ninguna circunstancia debes divulgar esta información.' }],
          },
          practice: [{ type: 'speaking', instruction: 'Say: "Rarely have I seen such an exceptional performance."', expected_words: ['rarely', 'have', 'seen', 'exceptional', 'performance'] }],
        },
      },
    ],
  },
  {
    block: 5,
    level: 'C1',
    name: '2. Subjuntivo en Inglés',
    description: 'Expresiones formales de demanda o urgencia (It is vital that he be present, I insist that she go).',
    icon: '🏛️',
    color_from: '#059669',
    color_to: '#10B981',
    order_index: 33,
    lessons: [
      {
        title: 'El Subjuntivo Mandatario en Inglés Formal',
        subtitle: 'It is essential that he be informed',
        order_index: 0,
        content: {
          intro: { text: 'En inglés formal, verbos como demand, insist, recommend usan el verbo en su forma infinitiva desnuda.', audio_text: 'It is crucial that every team member be aligned on the strategic vision.' },
          vocabulary: [
            { word: 'It is essential that...', pronunciation: 'i-sen-shal', translation: 'Es esencial que...', example: 'It is essential that she attend.' },
            { word: 'I recommend that...', pronunciation: 're-ko-mend', translation: 'Recomiendo que...', example: 'I recommend that he take the lead.' },
          ],
          dialogue: [
            { speaker: 'Gema', text: 'What are the executive recommendations for the project?', translation: '¿Cuáles son las recomendaciones ejecutivas para el proyecto?' },
            { speaker: 'Student', text: 'The board recommended that the CEO be present at the final negotiations.', translation: 'La junta recomendó que el CEO esté presente en las negociaciones finales.' },
          ],
          grammar: {
            rule: 'Verbo en forma base SIN conjugar (incluso en tercera persona)',
            explanation: '"It is vital that he BE present" (no "he is"), "I insist that she GO" (no "she goes").',
            examples: [{ sentence: 'The doctor advised that he take complete rest.', translation: 'El médico aconsejó que guardara reposo absoluto.' }],
          },
          practice: [{ type: 'speaking', instruction: 'Say: "It is essential that every participant be present on time."', expected_words: ['essential', 'every', 'participant', 'present', 'time'] }],
        },
      },
    ],
  },
  {
    block: 5,
    level: 'C2',
    name: '3. Futuro Perfecto y Futuro Continuo',
    description: 'By next year, I will have finished / This time tomorrow, I will be flying to Tokyo.',
    icon: '🚀',
    color_from: '#059669',
    color_to: '#10B981',
    order_index: 34,
    lessons: [
      {
        title: 'Will Have Done vs Will Be Doing',
        subtitle: 'Proyecciones temporales de alta precisión',
        order_index: 0,
        content: {
          intro: { text: 'Aprende a situarte en el futuro mirando hacia atrás o describiendo una acción en pleno desarrollo.', audio_text: 'By the end of this year, I will have mastered professional English communication.' },
          vocabulary: [
            { word: 'By the time...', pronunciation: 'bai de taim', translation: 'Para cuando...', example: 'By next month, I will have graduated.' },
            { word: 'This time next year', pronunciation: 'dis taim nekst yir', translation: 'A esta hora el próximo año', example: 'This time next year, I will be living abroad.' },
          ],
          dialogue: [
            { speaker: 'Gema', text: 'Where do you envision yourself five years from now?', translation: '¿Dónde te visualizas de aquí a cinco años?' },
            { speaker: 'Student', text: 'By that time, I will have founded my own company and will be leading international projects.', translation: 'Para ese momento habré fundado mi propia empresa y estaré liderando proyectos internacionales.' },
          ],
          grammar: {
            rule: 'Futuro Perfecto: Will have + Participio | Futuro Continuo: Will be + -ING',
            explanation: '"Will have completed" = la acción ya habrá terminado antes de ese momento futuro.',
            examples: [{ sentence: 'By 2030, technology will have transformed society.', translation: 'Para 2030 la tecnología habrá transformado la sociedad.' }],
          },
          practice: [{ type: 'speaking', instruction: 'Say: "By next year, I will have achieved complete fluency in English."', expected_words: ['next', 'year', 'will', 'have', 'achieved', 'fluency'] }],
        },
      },
    ],
  },
  {
    block: 5,
    level: 'C2',
    name: '4. Modismos (Idioms) y Jerga Regional',
    description: 'Expresiones culturales, metáforas cotidianas y lenguaje figurado de hablantes nativos.',
    icon: '💎',
    color_from: '#059669',
    color_to: '#10B981',
    order_index: 35,
    lessons: [
      {
        title: 'Los Modismos Nativos Más Populares',
        subtitle: 'Bite the bullet, hit the nail on the head, cut corners, see eye to eye',
        order_index: 0,
        content: {
          intro: { text: 'Los idioms son metáforas que no se traducen literalmente y demuestran verdadera maestría nativa.', audio_text: 'You hit the nail on the head! Learning idioms is the true key to sounding like a native.' },
          vocabulary: [
            { word: 'Hit the nail on the head', pronunciation: 'jit de neil on de jed', translation: 'Dar en el clavo / Acertar', example: 'You hit the nail on the head.' },
            { word: 'Bite the bullet', pronunciation: 'bait de bu-let', translation: 'Hacer de tripas corazón / Afrontar algo difícil', example: 'Let us bite the bullet and finish it.' },
            { word: 'See eye to eye', pronunciation: 'sii ai tu ai', translation: 'Estar completamente de acuerdo', example: 'We see eye to eye on this strategy.' },
            { word: 'Cut corners', pronunciation: 'kat kor-nerz', translation: 'Tomar atajos de mala calidad', example: 'We never cut corners on safety.' },
          ],
          dialogue: [
            { speaker: 'Gema', text: 'How did the strategy review go?', translation: '¿Cómo salió la revisión de la estrategia?' },
            { speaker: 'Student', text: 'Your analysis hit the nail on the head; we completely see eye to eye!', translation: 'Tu análisis dio en el clavo; ¡estamos completamente de acuerdo!' },
          ],
          grammar: {
            rule: 'Uso de modismos en contextos profesionales y cotidianos',
            explanation: 'Demuestra naturalidad cultural sin traducir mentalmente palabra por palabra.',
            examples: [{ sentence: 'It is a blessing in disguise (un bien que al principio parecía mal).', translation: 'No hay mal que por bien no venga.' }],
          },
          practice: [{ type: 'speaking', instruction: 'Say: "Your insight hit the nail on the head and we see eye to eye."', expected_words: ['insight', 'hit', 'nail', 'head', 'eye'] }],
        },
      },
    ],
  },
];

async function seed() {
  try {
    console.log('🌱 Starting 5-Block English Curriculum seed (36 full modules)...\n');

    await sequelize.sync();
    console.log('✅ Database connected & synchronized\n');

    // Default tenant
    const [tenant] = await Tenant.findOrCreate({
      where: { slug: 'kdice-main' },
      defaults: {
        name: 'KDice English Academy',
        slug: 'kdice-main',
        primary_color: '#059669',
        ai_daily_limit: 50,
        is_active: true,
        max_students: 1000,
      },
    });

    // Clean old modules & lessons
    console.log('🧹 Purging previous curriculum data...');
    await Lesson.destroy({ where: {}, force: true });
    await Evaluation.destroy({ where: {}, force: true });
    await Module.destroy({ where: {}, force: true });

    console.log('📚 Inserting 5 curriculum blocks...');
    for (const modData of curriculum) {
      const createdMod = await Module.create({
        level: modData.level,
        name: modData.name,
        description: modData.description,
        icon: modData.icon,
        color_from: modData.color_from,
        color_to: modData.color_to,
        order_index: modData.order_index,
        total_lessons: modData.lessons.length,
        xp_reward: 100 + modData.block * 25,
        is_published: true,
      });

      console.log(`   ✅ [Bloque ${modData.block} - ${modData.level}] ${modData.name}`);

      for (const lessonData of modData.lessons) {
        await Lesson.create({
          module_id: createdMod.id,
          title: lessonData.title,
          subtitle: lessonData.subtitle,
          order_index: lessonData.order_index,
          icon: modData.icon,
          duration_minutes: 12,
          xp_reward: 25,
          requires_voice: true,
          content: lessonData.content,
          is_published: true,
        });
      }

      // Create Evaluation for each module
      const evalTitle = `Final Evaluation: ${modData.name}`;
      const evalInstructions = `Demonstrate your mastery of the concepts from this module to certify it and advance.`;
      
      let evalQuestions = [];
      
      if (modData.evaluation && modData.evaluation.questions) {
        evalQuestions = modData.evaluation.questions;
      } else {
        // Improved generic English fallback for modules without specific evaluation data
        evalQuestions = [
          {
            id: 'q1',
            type: 'multiple_choice',
            question: `Which of the following is a key concept covered in the module "${modData.name}"?`,
            options: [
              'Practical application of grammar and pronunciation in real conversation',
              'Memorizing words without speaking',
              'Translating every word literally to Spanish',
              'None of the above'
            ],
            correct: 0,
            points: 50,
          },
          {
            id: 'q2',
            type: 'speaking',
            question: `Please say the following sentence clearly: "I am practicing the concepts from module ${modData.order_index + 1}."`,
            expected_words: ['practicing', 'concepts', 'module'],
            points: 50,
          },
        ];
      }

      await Evaluation.create({
        module_id: createdMod.id,
        title: evalTitle,
        instructions: evalInstructions,
        questions: evalQuestions,
        total_points: 100,
        min_pass_score: 70,
        time_limit_minutes: 15,
        max_attempts: 3,
        is_published: true,
      });
    }

    // Super Admin
    const email = process.env.SUPER_ADMIN_EMAIL || 'admin@kdice.com';
    await User.findOrCreate({
      where: { email },
      defaults: {
        name: 'Super Admin',
        email,
        password: process.env.SUPER_ADMIN_PASSWORD || 'Admin123!',
        role: ROLES.SUPER_ADMIN,
        current_level: LEVELS.C2,
        is_active: true,
      },
    });

    console.log('\n🎉 Complete 36-Module Curriculum Seeded Successfully!');
  } catch (error) {
    console.error('❌ Curriculum seed failed:', error);
    process.exit(1);
  }
}

seed().then(() => process.exit(0));
