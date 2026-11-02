# Bloque 12: regiones y neuroinclusión durante toda la vida

Fecha: 16 de octubre de 2026. Ejemplos de autor, **no** audio de acento acreditado ni curso regional completo.

## Decisiones

- Mantener independientes: idioma meta, variedad regional principal de comparación, preferencias de aprendizaje, franja de edad y nivel MCER. No clasificar ni diagnosticar a un estudiante por sus ajustes. La edad NO impone techo al nivel.
- Inglés `en-CA`, `en-US`, `en-GB`: pares de frases para **pedir dónde están los baños públicos** y **preguntar por ascensor**, con términos más frecuentes por región. Hay uso compartido y matices locales. No etiquetar expresiones como prohibidas en otros países.
- Francés `fr-CA`, `fr-FR`: una situación con `dépanneur` (establecimiento local de Quebec) frente a la descripción `petite épicerie` en Francia. Los tipos de comercio no son idénticos; el texto indica explícitamente esa diferencia.
- Etiquetas de vocabulario/región separadas de TTS. Un locale `en-GB` pedido al SO NO demuestra que la voz disponible tenga pronunciación británica natural, sea on-device ni que ASR de la clase cambie de dialecto.
- Catálogo `regional-variants.ts` ofrece comparación oculta, bajo demanda o siempre, persistencia de preferencias locales para la pantalla comparativa, textos originales, fuentes para verificar léxico. Otros cuatro idiomas siguen totalmente utilizables sin inventar variantes regionales aún.
- Módulo `experience.ts` y panel `LearningAdjustments` dirigido a adultos: corrección al responder, al acabar o a petición; contexto completo o paso a paso; baja estimulación o normal; sin diagnóstico, etiquetado neurocognitivo ni presión por rachas. Ajustes adultos se guardan solo en SQLite KV del dispositivo; todavía no es almacenamiento cifrado y no conserva datos de salud.
- Perfiles adolescentes/niños contemplados en motor, NO habilitados en interfaz pública hasta consentimiento, revisión pedagógica, privacidad y seguridad. Los adolescentes neurodivergentes no requieren curso más fácil ni infantilización. Para adultos neurodivergentes, el nivel y la selección de empleo/ocio se conservan independientemente de las preferencias sensoriales y de corrección.

## Implementación

- `packages/core/src/regional-variants.ts`: dos comparaciones de inglés (3 variantes) y una de francés (2 variantes), 8 expresiones originales; selección, validación, representación sin red y fuentes.
- `packages/core/src/experience.ts`: preferencias de enseñanza sin diagnóstico, valores seguros, puerta de seguridad para perfiles menores.
- Nuevas pruebas dedicadas de core: verificación de 30 combinaciones originales, sin mezclar locaciones EN/FR, valores no válidos, metadatos de fuente/voz y no establecer techo MCER.
- `mobile/RegionalComparisons.tsx`: selector regional, comparar a demanda/automático, lectura mediante síntesis del sistema cuando exista, **no audio regional verificado**.
- `mobile/LearningAdjustments.tsx`: controles adultos con persistencia local; modalidad de corrección e instrucciones aplicada inicialmente a `GuidedDialoguePractice` (no toda la app), pantalla de apoyo voluntaria y aviso de funciones infantiles sin aprobación.
- `mobile/App.tsx`: inserta ambos paneles; mantiene progreso y preferencias de idioma por separado.

## Fuentes oficiales para los usos lingüísticos y accesibilidad

- Oxford Advanced Learner's Dictionary: `washroom` canadiense, `restroom` estadounidense, `toilet` británico. https://www.oxfordlearnersdictionaries.com/definition/english/toilet y https://www.oxfordlearnersdictionaries.com/us/definition/english/washroom
- British Council, diferencias British / American English: https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/british-english-american-english
- OQLF, `dépanneur`: https://vitrinelinguistique.oqlf.gouv.qc.ca/fiche-gdt/fiche/1299675/depanneur
- Académie française, `dépanneur`: https://www.dictionnaire-academie.fr/article/A9D1428
- CAST Universal Design for Learning 3.0: https://udlguidelines.cast.org/more/about-guidelines-3-0/ y https://teaching.utoronto.ca/teaching-uoft-udl/udl-design/

## Límites y tareas siguientes

Este prototipo no distingue aún fonemas/acento en audio, no enseña oficialmente todos los dialectos, ni cambia el locale de ASR en la práctica principal con solo tocar la tarjeta regional. El catálogo es **introductorio** (8 ejemplos), no un curso completo. Los ajustes de corrección se aplican solo a práctica dialogada; otras pantallas todavía deben unificarse. El acceso a perfiles infantiles sigue bloqueado en el diseño.

Prioridad siguiente: uniformar las preferencias en todos los módulos, agregar consentimiento y revisión de contenido infantil, producir grabaciones regionales con licencias verificables, probar ASR/TTS y Bluetooth en iOS y Android y evaluar el trato de variantes equivalentes por intención sin falsas correcciones.
