'use strict';

const { Module, Lesson, Evaluation } = require('../models');

/**
 * DEFAULT_TEEN_MODULES
 * Currículo oficial de K-Dice para el segmento Jóvenes (8-16 años)
 * 1. Gramática avanzada: Tiempos verbales, verbos modales, conectores discursivos.
 * 2. Habilidades comunicativas: Describir, comparar, justificar opiniones, narrar experiencias, debatir.
 * 3. Enfoque práctico: Conversaciones en vivo, comprensión de textos, simulaciones reales.
 */
const DEFAULT_TEEN_MODULES = [
  {
    name: '1. Gramática Avanzada para Jóvenes',
    level: 'B1',
    age_range: 'teens',
    icon: '⚡',
    description: 'Tiempos verbales en pasado, presente y futuro, verbos modales y conectores discursivos.',
    color_from: '#6366f1',
    color_to: '#8b5cf6',
    order_index: 0,
    xp_reward: 180,
    evaluation: {
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice',
          question: 'Which sentence correctly uses a modal verb for advice?',
          options: ['You must to study.', 'You should get some rest.', 'You can studying now.', 'You ought sleep.'],
          correct: 1,
          points: 35,
        },
        {
          id: 'q2',
          type: 'multiple_choice',
          question: 'Choose the correct connector of contrast:',
          options: ['Therefore', 'Furthermore', 'However', 'In addition'],
          correct: 2,
          points: 35,
        },
        {
          id: 'q3',
          type: 'speaking',
          question: 'Say: "Yesterday I was studying, but tomorrow I will travel."',
          expected_words: ['yesterday', 'studying', 'tomorrow', 'travel'],
          points: 30,
        },
      ],
    },
    lessons: [
      {
        title: 'Tiempos Verbales: Pasado, Presente y Futuro',
        subtitle: 'Past Simple, Present Continuous y Future con Will / Going To',
        order_index: 0,
        icon: '⏳',
        duration_minutes: 15,
        xp_reward: 60,
        teacher_prompt: 'Explica con ejemplos dinámicos la diferencia entre acciones pasadas completas, acciones que ocurren ahora y planes futuros para jóvenes.',
        content: {
          teens_game: 'boss_battle',
          intro: {
            text: 'Aprenderemos a contrastar lo que hiciste ayer, lo que estás viviendo ahora y tus metas de futuro.',
            audio_text: 'Let us master the past, present, and future tenses in English!',
          },
          vocabulary: [
            { word: 'Yesterday', pronunciation: 'yesterdei', translation: 'Ayer', example: 'Yesterday I finished my project.' },
            { word: 'Right now', pronunciation: 'rait nau', translation: 'Ahora mismo', example: 'We are learning right now.' },
            { word: 'Tomorrow', pronunciation: 'tumórrou', translation: 'Mañana', example: 'Tomorrow we will celebrate.' },
            { word: 'Will happen', pronunciation: 'uil jápen', translation: 'Sucederá', example: 'Great things will happen.' },
            { word: 'Was studying', pronunciation: 'uas stadi-ing', translation: 'Estaba estudiando', example: 'I was studying while he called.' },
          ],
          dialogue: [
            { speaker: 'Alex', text: 'What did you do yesterday afternoon?', translation: '¿Qué hiciste ayer por la tarde?' },
            { speaker: 'Sam', text: 'I was practicing guitar, and tomorrow I will play in the school band!', translation: 'Estaba practicando guitarra, ¡y mañana tocaré en la banda escolar!' },
          ],
          grammar: {
            rule: 'Tiempos contrastados: Past Simple (-ed / irregulares), Continuous (was/were + -ing), Future (will + base form)',
            explanation: 'Usa Past Simple para hechos terminados, Past Continuous para acciones en progreso en el pasado, y Will para el futuro.',
            examples: [
              { sentence: 'I played soccer yesterday and I will play again tomorrow.', translation: 'Jugué al fútbol ayer y volveré a jugar mañana.' },
            ],
          },
          practice: [
            { type: 'speaking', instruction: 'Say: "Yesterday I was studying, but tomorrow I will travel."', expected_words: ['yesterday', 'studying', 'tomorrow', 'travel'] },
          ],
        },
      },
      {
        title: 'Verbos Modales: Obligación, Posibilidad y Consejos',
        subtitle: 'Can, Could, Should, Must y Might en acción',
        order_index: 1,
        icon: '🛡️',
        duration_minutes: 15,
        xp_reward: 60,
        teacher_prompt: 'Enseña el uso de verbos modales para aconsejar, prohibir o sugerir ideas en entornos escolares y juveniles.',
        content: {
          teens_game: 'word_shooter',
          intro: {
            text: 'Los verbos modales transforman el sentido de una frase para expresar consejos, deberes y probabilidades.',
            audio_text: 'You should practice every day, and you might become an expert!',
          },
          vocabulary: [
            { word: 'Should', pronunciation: 'shud', translation: 'Deberías (consejo)', example: 'You should drink more water.' },
            { word: 'Must', pronunciation: 'mast', translation: 'Debes (obligación)', example: 'Students must wear their badge.' },
            { word: 'Might', pronunciation: 'mait', translation: 'Podría ser (probabilidad)', example: 'It might rain this evening.' },
            { word: 'Could', pronunciation: 'kud', translation: 'Podrías (sugerencia/habilidad)', example: 'You could try rebooting your tablet.' },
            { word: 'Ought to', pronunciation: 'ot tu', translation: 'Tendrías que', example: 'We ought to support our friends.' },
          ],
          dialogue: [
            { speaker: 'Mia', text: 'I feel nervous about the championship game.', translation: 'Me siento nervioso por el partido del campeonato.' },
            { speaker: 'Leo', text: 'You should stay calm. You have trained hard, you might win today!', translation: 'Deberías mantener la calma. Has entrenado duro, ¡podrías ganar hoy!' },
          ],
          grammar: {
            rule: 'Modal Verbs + Base Form (sin "to")',
            explanation: 'Los verbos modales no llevan "s" en tercera persona ni "to" después (excepto ought to).',
            examples: [
              { sentence: 'She must submit the assignment before 5 PM.', translation: 'Ella debe enviar la tarea antes de las 5 PM.' },
            ],
          },
          practice: [
            { type: 'speaking', instruction: 'Say: "You should practice every day if you want to succeed."', expected_words: ['should', 'practice', 'every', 'day', 'succeed'] },
          ],
        },
      },
      {
        title: 'Conectores Discursivos y Cohesión Textual',
        subtitle: 'However, Therefore, Furthermore, In addition y Although',
        order_index: 2,
        icon: '🔗',
        duration_minutes: 15,
        xp_reward: 60,
        teacher_prompt: 'Guía a los alumnos a estructurar párrafos y discursos utilizando conectores de contraste, causa y adición.',
        content: {
          teens_game: 'speed_typer',
          intro: {
            text: 'Los conectores discursivos unen tus ideas para que tus redacciones y opiniones suenen fluidas y profesionales.',
            audio_text: 'Linking words make your English persuasive and cohesive.',
          },
          vocabulary: [
            { word: 'However', pronunciation: 'jau-éver', translation: 'Sin embargo', example: 'I wanted to go; however, it rained.' },
            { word: 'Therefore', pronunciation: 'dér-for', translation: 'Por lo tanto', example: 'He trained hard; therefore, he won.' },
            { word: 'Furthermore', pronunciation: 'fórder-mor', translation: 'Además / Es más', example: 'Furthermore, reading boosts focus.' },
            { word: 'Although', pronunciation: 'ol-dóu', translation: 'Aunque', example: 'Although it was late, we finished.' },
            { word: 'In addition', pronunciation: 'in adíshan', translation: 'Adicionalmente', example: 'In addition, we learned new vocabulary.' },
          ],
          dialogue: [
            { speaker: 'Chris', text: 'Online gaming can be very social; however, we should also play sports.', translation: 'Los videojuegos online pueden ser muy sociales; sin embargo, también deberíamos hacer deporte.' },
            { speaker: 'Taylor', text: 'Furthermore, getting fresh air helps us concentrate better!', translation: '¡Además, tomar aire fresco nos ayuda a concentrarnos mejor!' },
          ],
          grammar: {
            rule: 'Puntuación con conectores discursivos',
            explanation: 'However y Therefore suelen ir precedidos de punto y coma o punto, seguidos de coma.',
            examples: [
              { sentence: 'The challenge was tough; however, we reached our goal.', translation: 'El reto fue difícil; sin embargo, alcanzamos nuestra meta.' },
            ],
          },
          practice: [
            { type: 'speaking', instruction: 'Say: "Although it was difficult, therefore we succeeded together."', expected_words: ['although', 'difficult', 'therefore', 'succeeded', 'together'] },
          ],
        },
      },
    ],
  },
  {
    name: '2. Habilidades Comunicativas Juveniles',
    level: 'B1',
    age_range: 'teens',
    icon: '🗣️',
    description: 'Describir, comparar, justificar opiniones, narrar experiencias y debatir temas de interés juvenil (tecnología, redes sociales, cultura pop).',
    color_from: '#10b981',
    color_to: '#059669',
    order_index: 1,
    xp_reward: 200,
    evaluation: {
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice',
          question: 'Which phrase is best to introduce a justified personal opinion?',
          options: ['From my perspective...', 'I not think...', 'Yesterday was...', 'Due to nothing...'],
          correct: 0,
          points: 35,
        },
        {
          id: 'q2',
          type: 'multiple_choice',
          question: 'Which tense combination is used to tell an interrupted past story?',
          options: ['Past Continuous + Past Simple', 'Future + Present', 'Past Perfect + Future', 'Present Simple + Past Continuous'],
          correct: 0,
          points: 35,
        },
        {
          id: 'q3',
          type: 'speaking',
          question: 'Say: "From my perspective, technology improves our daily life."',
          expected_words: ['perspective', 'technology', 'improves', 'daily', 'life'],
          points: 30,
        },
      ],
    },
    lessons: [
      {
        title: 'Describir y Comparar Tendencias Actuales',
        subtitle: 'Comparativas y superlativos sobre tecnología, videojuegos y moda',
        order_index: 0,
        icon: '📱',
        duration_minutes: 15,
        xp_reward: 50,
        teacher_prompt: 'Enseña a comparar productos tecnológicos y gustos juveniles usando adjetivos comparativos y superlativos.',
        content: {
          teens_game: 'roleplay_shop',
          intro: {
            text: 'Aprende a comparar dispositivos, series de televisión y videojuegos justificando por qué uno es mejor que otro.',
            audio_text: 'Let us describe and compare gadgets and trends in modern English!',
          },
          vocabulary: [
            { word: 'More powerful', pronunciation: 'mor páuer-ful', translation: 'Más potente', example: 'This console is more powerful.' },
            { word: 'The most popular', pronunciation: 'de móust pópiular', translation: 'El más popular', example: 'It is the most popular game.' },
            { word: 'Trendy', pronunciation: 'tréndi', translation: 'De moda / en tendencia', example: 'These sneakers are trendy.' },
            { word: 'Outdated', pronunciation: 'aut-déited', translation: 'Anticuado', example: 'That old phone is outdated.' },
            { word: 'User-friendly', pronunciation: 'yúser fréndli', translation: 'Fácil de usar', example: 'The interface is user-friendly.' },
          ],
          dialogue: [
            { speaker: 'Jordan', text: 'This smartphone is much faster than the older model.', translation: 'Este teléfono es mucho más rápido que el modelo anterior.' },
            { speaker: 'Kelly', text: 'Yes, but it is also the most expensive one on the shelf!', translation: '¡Sí, pero también es el más costoso de la tienda!' },
          ],
          grammar: {
            rule: 'Comparativos con -er / more y Superlativos con -est / most',
            explanation: 'Adjetivos cortos llevan -er / -est (fast -> faster -> fastest). Largos llevan more / most (powerful -> more powerful -> most powerful).',
            examples: [
              { sentence: 'My laptop is lighter and more efficient than yours.', translation: 'Mi portátil es más liviana y más eficiente que la tuya.' },
            ],
          },
          practice: [
            { type: 'speaking', instruction: 'Say: "This new device is much faster than my previous computer."', expected_words: ['device', 'faster', 'previous', 'computer'] },
          ],
        },
      },
      {
        title: 'Justificar Opiniones y Dar Argumentos',
        subtitle: 'In my opinion, I strongly believe, Due to the fact that...',
        order_index: 1,
        icon: '💡',
        duration_minutes: 15,
        xp_reward: 50,
        teacher_prompt: 'Fomenta el pensamiento crítico y la argumentación basada en razones y evidencias en inglés.',
        content: {
          teens_game: 'debate_arena',
          intro: {
            text: 'Aprende a exponer tu punto de vista de forma convincente y respaldarlo con argumentos claros.',
            audio_text: 'Expressing your opinion clearly is key to great communication.',
          },
          vocabulary: [
            { word: 'In my opinion', pronunciation: 'in mai opínion', translation: 'En mi opinión', example: 'In my opinion, teamwork is essential.' },
            { word: 'I strongly believe', pronunciation: 'ai stróngli bilív', translation: 'Creo firmemente', example: 'I strongly believe in practice.' },
            { word: 'Due to', pronunciation: 'diu tu', translation: 'Debido a', example: 'Due to the rain, we stayed inside.' },
            { word: 'From my perspective', pronunciation: 'from mai perspéktiv', translation: 'Desde mi perspectiva', example: 'From my perspective, it works well.' },
            { word: 'Evidence shows', pronunciation: 'évides shóus', translation: 'La evidencia demuestra', example: 'Evidence shows positive results.' },
          ],
          dialogue: [
            { speaker: 'Maya', text: 'Do you think remote learning is helpful for students?', translation: '¿Crees que el aprendizaje remoto es útil para los estudiantes?' },
            { speaker: 'Sam', text: 'From my perspective, it offers great flexibility, due to online resources.', translation: 'Desde mi perspectiva ofrece gran flexibilidad, debido a los recursos en línea.' },
          ],
          grammar: {
            rule: 'Estructura de opinión argumentada: Frase de opinión + Idea + Conector causal (because, due to, since) + Evidencia',
            explanation: 'Evita decir solo "I like it". Enriquécete diciendo "I strongly believe... because..."',
            examples: [
              { sentence: 'I believe this policy is beneficial due to its positive impact.', translation: 'Creo que esta política es beneficiosa debido a su impacto positivo.' },
            ],
          },
          practice: [
            { type: 'speaking', instruction: 'Say: "From my perspective, technology improves our daily life."', expected_words: ['perspective', 'technology', 'improves', 'daily', 'life'] },
          ],
        },
      },
      {
        title: 'Narrar Experiencias y Anécdotas Personales',
        subtitle: 'Storytelling combinando Past Simple y Past Continuous',
        order_index: 2,
        icon: '📖',
        duration_minutes: 15,
        xp_reward: 50,
        teacher_prompt: 'Enseña técnicas de narración oral y escrita (storytelling) para contar viajes, anécdotas y sucesos imprevistos.',
        content: {
          teens_game: 'rpg_adventure',
          intro: {
            text: 'Domina el arte de narrar historias en inglés enganchando a tu audiencia con detalles y giros temporales.',
            audio_text: 'Tell engaging stories using time markers and vivid action verbs.',
          },
          vocabulary: [
            { word: 'Suddenly', pronunciation: 'sádenli', translation: 'De repente', example: 'Suddenly, the music stopped.' },
            { word: 'While I was walking', pronunciation: 'uáil ai uas uóking', translation: 'Mientras caminaba', example: 'While I was walking, I saw a puppy.' },
            { word: 'Unbelievable', pronunciation: 'an-bilívabol', translation: 'Increíble', example: 'It was an unbelievable experience.' },
            { word: 'Turned out to be', pronunciation: 'tórnd aut tu bi', translation: 'Resultó ser', example: 'It turned out to be our teacher!' },
            { word: 'As soon as', pronunciation: 'as sun as', translation: 'Tan pronto como', example: 'As soon as we arrived, the show started.' },
          ],
          dialogue: [
            { speaker: 'Lucas', text: 'You will not believe what happened during our trip last weekend!', translation: '¡No vas a creer lo que pasó durante nuestro viaje el fin de semana pasado!' },
            { speaker: 'Zoe', text: 'Tell me everything! Were you hiking when the thunderstorm started?', translation: '¡Cuéntame todo! ¿Estaban haciendo senderismo cuando empezó la tormenta?' },
          ],
          grammar: {
            rule: 'Acciones interrumpidas en el pasado (When / While)',
            explanation: 'Usa Past Continuous con "While" para la acción de fondo, y Past Simple con "When" para la acción que interrumpe.',
            examples: [
              { sentence: 'While we were studying, the power suddenly went out.', translation: 'Mientras estábamos estudiando, la electricidad se fue de repente.' },
            ],
          },
          practice: [
            { type: 'speaking', instruction: 'Say: "While I was traveling, I met wonderful new friends."', expected_words: ['while', 'traveling', 'wonderful', 'friends'] },
          ],
        },
      },
      {
        title: 'Debates Juveniles: Redes Sociales, IA y Cultura Pop',
        subtitle: 'Discusión crítica sobre algoritmos, creadores de contenido y el futuro digital',
        order_index: 3,
        icon: '🎤',
        duration_minutes: 15,
        xp_reward: 50,
        teacher_prompt: 'Fomenta un debate moderado en inglés donde los estudiantes tomen posturas a favor y en contra con argumentos respetuosos.',
        content: {
          teens_game: 'detective_lies',
          intro: {
            text: 'Debate con fluidez sobre temas que te apasionan: redes sociales, inteligencia artificial y el impacto de los creadores digitales.',
            audio_text: 'Join the debate on AI and social media with persuasive English vocabulary.',
          },
          vocabulary: [
            { word: 'Artificial intelligence', pronunciation: 'artifíshal intelíyens', translation: 'Inteligencia artificial', example: 'Artificial intelligence is evolving.' },
            { word: 'Viral content', pronunciation: 'váiral cóntent', translation: 'Contenido viral', example: 'Her video became viral content.' },
            { word: 'Privacy concerns', pronunciation: 'práivasi konsérns', translation: 'Preocupaciones de privacidad', example: 'We must address privacy concerns.' },
            { word: 'Algorithm', pronunciation: 'álgorid-em', translation: 'Algoritmo', example: 'The algorithm recommends new songs.' },
            { word: 'Influential', pronunciation: 'influ-énshal', translation: 'Influyente', example: 'Tech creators are very influential.' },
          ],
          dialogue: [
            { speaker: 'Noah', text: 'Do you believe social media algorithms influence our decisions too much?', translation: '¿Crees que los algoritmos de redes sociales influyen demasiado en nuestras decisiones?' },
            { speaker: 'Emma', text: 'On the one hand they do, but on the other hand they help us discover creators worldwide.', translation: 'Por un lado sí, pero por otro lado nos ayudan a descubrir creadores de todo el mundo.' },
          ],
          grammar: {
            rule: 'Contraargumentos y balance: "On the one hand..., on the other hand..."',
            explanation: 'Estructura ideal para debatir reconociendo los dos lados de una moneda.',
            examples: [
              { sentence: 'On the one hand AI is useful; on the other hand we need caution.', translation: 'Por un lado la IA es útil; por otro lado necesitamos precaución.' },
            ],
          },
          practice: [
            { type: 'speaking', instruction: 'Say: "Artificial intelligence brings great opportunities and new challenges."', expected_words: ['artificial', 'intelligence', 'opportunities', 'challenges'] },
          ],
        },
      },
    ],
  },
  {
    name: '3. Enfoque Práctico y Situaciones Reales',
    level: 'B1',
    age_range: 'teens',
    icon: '🎯',
    description: 'Conversaciones en vivo, comprensión de textos orales y escritos, y simulaciones de situaciones reales.',
    color_from: '#f59e0b',
    color_to: '#d97706',
    order_index: 2,
    xp_reward: 190,
    evaluation: {
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice',
          question: 'What is a polite way to ask for assistance in a foreign airport?',
          options: ['Give me ticket now!', 'Excuse me, could you please help me find my gate?', 'Where is it fast!', 'I want help.'],
          correct: 1,
          points: 35,
        },
        {
          id: 'q2',
          type: 'multiple_choice',
          question: 'Which word means a major revolutionary discovery in a news report?',
          options: ['Headline', 'Breakthrough', 'Outdated', 'Refund'],
          correct: 1,
          points: 35,
        },
        {
          id: 'q3',
          type: 'speaking',
          question: 'Say: "Sounds like a great plan, let us keep in touch!"',
          expected_words: ['sounds', 'great', 'plan', 'keep', 'touch'],
          points: 30,
        },
      ],
    },
    lessons: [
      {
        title: 'Conversaciones en Vivo y Respuestas Rápidas',
        subtitle: 'Fluidez espontánea, saludos juveniles, modismos y small talk',
        order_index: 0,
        icon: '💬',
        duration_minutes: 15,
        xp_reward: 65,
        teacher_prompt: 'Prepara a los jóvenes para mantener conversaciones casuales espontáneas con angloparlantes de su misma edad.',
        content: {
          teens_game: 'word_runner',
          intro: {
            text: 'Aprende expresiones auténticas y modismos naturales que los jóvenes usan a diario en países anglosajones.',
            audio_text: 'Speak naturally and respond quickly in real-life casual conversations!',
          },
          vocabulary: [
            { word: 'What is up?', pronunciation: 'uats ap', translation: '¿Qué tal? / ¿Qué pasa?', example: 'Hey guys, what is up?' },
            { word: 'Sounds like a plan', pronunciation: 'saunds laik a plan', translation: 'Me parece un planazo', example: 'Meeting at 5? Sounds like a plan!' },
            { word: 'No big deal', pronunciation: 'nóu big díil', translation: 'No pasa nada / No es para tanto', example: 'Do not worry, it is no big deal.' },
            { word: 'I catch your drift', pronunciation: 'ai cach yur drift', translation: 'Te capto la idea', example: 'Yes, I catch your drift completely.' },
            { word: 'Keep in touch', pronunciation: 'kíip in tach', translation: 'Mantenerse en contacto', example: 'Let us keep in touch on Discord.' },
          ],
          dialogue: [
            { speaker: 'Ben', text: 'Hey Olivia! Are you going to the school coding contest?', translation: '¡Hola Olivia! ¿Vas a ir al concurso de programación escolar?' },
            { speaker: 'Olivia', text: 'Totally! Sounds like a great plan. Let us team up and win that trophy!', translation: '¡Totalmente! Me parece un gran plan. ¡Hagamos equipo y ganemos ese trofeo!' },
          ],
          grammar: {
            rule: 'Reacciones naturales (Rejoinders): Totally!, No way!, Sounds great!, Same here!',
            explanation: 'En inglés conversacional, responder con un rejoinder demuestra que estás escuchando activamente.',
            examples: [
              { sentence: 'Sounds like a great plan, let us do it!', translation: '¡Suena como un gran plan, hagámoslo!' },
            ],
          },
          practice: [
            { type: 'speaking', instruction: 'Say: "Sounds like a great plan, let us keep in touch!"', expected_words: ['sounds', 'great', 'plan', 'keep', 'touch'] },
          ],
        },
      },
      {
        title: 'Comprensión de Textos y Noticias de Tendencias',
        subtitle: 'Lectura crítica de artículos web, blogs, reseñas y titulares en inglés',
        order_index: 1,
        icon: '📰',
        duration_minutes: 15,
        xp_reward: 65,
        teacher_prompt: 'Guía a los estudiantes en la lectura comprensiva de noticias digitales identificando ideas principales y fuentes confiables.',
        content: {
          teens_game: 'news_anchor',
          intro: {
            text: 'Desarrolla la habilidad de leer artículos reales, identificar titulares sensacionalistas y extraer información clave.',
            audio_text: 'Become a critical reader of news articles and tech blogs in English.',
          },
          vocabulary: [
            { word: 'Headline', pronunciation: 'jéd-lain', translation: 'Titular de noticia', example: 'The headline caught everyone attention.' },
            { word: 'According to', pronunciation: 'akórding tu', translation: 'De acuerdo con / según', example: 'According to scientists, stars are born here.' },
            { word: 'Breakthrough', pronunciation: 'bréik-zru', translation: 'Avance revolucionario', example: 'Medical breakthrough saves lives.' },
            { word: 'Source', pronunciation: 'sórs', translation: 'Fuente informativa', example: 'Verify your source before sharing.' },
            { word: 'Reliable', pronunciation: 'rilái-abol', translation: 'Confiable', example: 'This news website is reliable.' },
          ],
          dialogue: [
            { speaker: 'Daniel', text: 'Did you read the headline about the reusable rocket launch?', translation: '¿Leíste el titular sobre el lanzamiento del cohete reutilizable?' },
            { speaker: 'Sarah', text: 'Yes, according to the official report, it achieved an unprecedented milestone!', translation: '¡Sí, según el informe oficial, logró un hito sin precedentes!' },
          ],
          grammar: {
            rule: 'Estructuras de reporte: "According to [source]..." / "The article states that..."',
            explanation: 'Para resumir textos y citar información de forma objetiva en inglés.',
            examples: [
              { sentence: 'According to researchers, sleep is crucial for academic success.', translation: 'Según los investigadores, el sueño es crucial para el éxito académico.' },
            ],
          },
          practice: [
            { type: 'speaking', instruction: 'Say: "According to the latest report, technology is advancing rapidly."', expected_words: ['according', 'latest', 'report', 'technology', 'rapidly'] },
          ],
        },
      },
      {
        title: 'Simulaciones de la Vida Real y Resolución de Imprevistos',
        subtitle: 'Viajes, compras internacionales, aeropuertos y atención al cliente',
        order_index: 2,
        icon: '✈️',
        duration_minutes: 15,
        xp_reward: 60,
        teacher_prompt: 'Simula situaciones prácticas de viaje y compras internacionales donde el estudiante deba comunicarse para resolver un problema.',
        content: {
          teens_game: 'escape_room',
          intro: {
            text: 'Enfrenta situaciones reales en el extranjero: pedir indicaciones, cambiar un producto o resolver un vuelo cancelado.',
            audio_text: 'Solve real-life travel and customer service scenarios with confidence.',
          },
          vocabulary: [
            { word: 'Could you help me?', pronunciation: 'kud yu jelp mi', translation: '¿Podría ayudarme?', example: 'Excuse me, could you help me please?' },
            { word: 'Flight delay', pronunciation: 'flait diléi', translation: 'Retraso de vuelo', example: 'Our flight delay was two hours.' },
            { word: 'Lost property', pronunciation: 'lost próperti', translation: 'Objetos perdidos', example: 'I left my backpack at lost property.' },
            { word: 'Customer service', pronunciation: 'kástomer sérvis', translation: 'Atención al cliente', example: 'Customer service resolved my issue.' },
            { word: 'Refund or exchange', pronunciation: 'rífand or ekschéiny', translation: 'Reembolso o cambio', example: 'Can I request a refund or exchange?' },
          ],
          dialogue: [
            { speaker: 'Traveler', text: 'Excuse me, could you please help me find the boarding gate for flight 402?', translation: 'Disculpe, ¿podría ayudarme a encontrar la puerta de embarque del vuelo 402?' },
            { speaker: 'Agent', text: 'Certainly! Walk straight ahead and turn left at terminal B.', translation: '¡Con gusto! Camine derecho y gire a la izquierda en la terminal B.' },
          ],
          grammar: {
            rule: 'Peticiones formales y educadas: "Could you please...?" / "Would you mind + -ing...?"',
            explanation: 'En aeropuertos y tiendas, usar "Could you please..." en lugar de "Give me..." abre todas las puertas.',
            examples: [
              { sentence: 'Could you please check if my luggage has arrived?', translation: '¿Podría por favor verificar si mi equipaje ha llegado?' },
            ],
          },
          practice: [
            { type: 'speaking', instruction: 'Say: "Excuse me, could you please help me find the right gate?"', expected_words: ['excuse', 'could', 'please', 'help', 'gate'] },
          ],
        },
      },
    ],
  },
];

/**
 * ensureTeenCurriculum
 * Verifica si los 3 módulos globales para jóvenes existen en la base de datos (tenant_id: null).
 * Si no existen, los crea con todas sus lecciones, contenidos y evaluaciones.
 */
async function ensureTeenCurriculum() {
  try {
    for (const modData of DEFAULT_TEEN_MODULES) {
      let [module, created] = await Module.findOrCreate({
        where: {
          name: modData.name,
          age_range: 'teens',
          tenant_id: null,
        },
        defaults: {
          name: modData.name,
          level: modData.level,
          age_range: 'teens',
          subject: 'english',
          icon: modData.icon,
          description: modData.description,
          color_from: modData.color_from,
          color_to: modData.color_to,
          order_index: modData.order_index,
          total_lessons: modData.lessons.length,
          xp_reward: modData.xp_reward,
          is_published: true,
          tenant_id: null,
        },
      });

      // Crear o actualizar lecciones
      const lessonCount = await Lesson.count({ where: { module_id: module.id } });
      if (lessonCount === 0 || created) {
        for (const lData of modData.lessons) {
          await Lesson.create({
            module_id: module.id,
            tenant_id: null,
            age_range: 'teens',
            subject: 'english',
            title: lData.title,
            subtitle: lData.subtitle,
            order_index: lData.order_index,
            icon: lData.icon,
            duration_minutes: lData.duration_minutes,
            xp_reward: lData.xp_reward,
            teacher_prompt: lData.teacher_prompt,
            content: lData.content,
            is_published: true,
            source: 'global',
          });
        }
        await module.update({ total_lessons: modData.lessons.length });
      }

      // Crear evaluación si no existe
      if (modData.evaluation) {
        const existingEval = await Evaluation.findOne({ where: { module_id: module.id } });
        if (!existingEval) {
          await Evaluation.create({
            module_id: module.id,
            title: `Examen de ${modData.name}`,
            passing_score: 70,
            questions: modData.evaluation.questions,
            is_published: true,
          });
        }
      }
    }
    console.log('✅ Currículo oficial de Jóvenes (Teens) verificado/cargado con éxito');
  } catch (error) {
    console.warn('⚠️ Error al asegurar currículo de Teens:', error.message);
  }
}

module.exports = {
  DEFAULT_TEEN_MODULES,
  ensureTeenCurriculum,
};
