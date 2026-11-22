"""Build deterministic Spanish catalogue labels, preserving source IDs and aliases."""
import json,re
from pathlib import Path
root=Path(__file__).resolve().parents[1]
items=json.loads((root/'www/exercises.json').read_text(encoding='utf-8'))
# Movement first, then clearly separated variants. No runtime translation or AI.
phrases='''
bench press|Press de banca
shoulder press|Press de hombros
military press|Press militar
chest press|Press de pecho
floor press|Press en el suelo
leg press|Prensa de piernas
calf press|Extensión de gemelos
calf raises|Elevación de talones
calf raise|Elevación de talones
calf stretch|Estiramiento de gemelos
leg extensions|Extensión de piernas
leg extension|Extensión de piernas
leg curls|Flexión de piernas
leg curl|Flexión de piernas
hammer curls|Flexión de bíceps con agarre martillo
hammer curl|Flexión de bíceps con agarre martillo
preacher curls|Flexión de bíceps en banco predicador
preacher curl|Flexión de bíceps en banco predicador
concentration curls|Flexión concentrada de bíceps
concentration curl|Flexión concentrada de bíceps
spider curl|Flexión de bíceps araña
bicep curl|Flexión de bíceps
biceps curl|Flexión de bíceps
wrist curl|Flexión de muñeca
triceps extension|Extensión de tríceps
tricep extension|Extensión de tríceps
triceps press|Press de tríceps
tricep press|Press de tríceps
triceps pushdown|Extensión de tríceps hacia abajo
triceps overhead extension|Extensión de tríceps sobre la cabeza
rear delt raise|Elevación de deltoides posterior
rear lateral raise|Elevación posterior
deltoid raise|Elevación de deltoides
lateral raise|Elevación lateral
side laterals|Elevaciones laterales
side lateral|Elevación lateral
front delt raise|Elevación del deltoides anterior
front raise|Elevación frontal
shoulder raise|Elevación de hombros
leg raises|Elevación de piernas
leg raise|Elevación de piernas
leg lift|Elevación de piernas
hip raise|Elevación de cadera
hip lift|Elevación de cadera
glute bridge|Puente de glúteos
hip bridge|Puente de cadera
hip thrust|Empuje de cadera
hip adduction|Aducción de cadera
hip adductions|Aducción de cadera
hip extension|Extensión de cadera
hip flexion|Flexión de cadera
hip circles|Círculos de cadera
arm circles|Círculos de brazos
ankle circles|Círculos de tobillo
elbow circles|Círculos de codos
knee circles|Círculos de rodillas
shoulder circles|Círculos de hombros
wrist circles|Círculos de muñecas
leg pull-in|Recogida de piernas
leg tucks|Recogida de piernas
side bend|Flexión lateral del tronco
side bends|Flexiones laterales del tronco
side bridge|Plancha lateral
side plank|Plancha lateral
split squat|Sentadilla dividida
split squats|Sentadilla dividida
box squat|Sentadilla a cajón
hack squat|Sentadilla hack
hack squats|Sentadilla hack
pistol squat|Sentadilla a una pierna
jump squat|Sentadilla con salto
sissy squat|Sentadilla sissy
goblet squat|Sentadilla de copa
good mornings|Buenos días
good morning|Buenos días
lat pulldown|Jalón al pecho
lat pulldowns|Jalón al pecho
pull-ups|Dominadas
pull-up|Dominada
pullups|Dominadas
pullup|Dominada
pull ups|Dominadas
chin-up|Dominada supina
chins|Dominadas supinas
chin|Dominada supina
push-ups|Flexiones de brazos
push-up|Flexión de brazos
pushups|Flexiones de brazos
push up|Flexión de brazos
sit-ups|Abdominales completos
sit-up|Abdominal completo
sit ups|Abdominales completos
upright row|Remo al mentón
rear delt row|Remo para deltoides posterior
rear-delt rows|Remo para deltoides posterior
renegade row|Remo renegado
t-bar row|Remo con barra T
long bar row|Remo con extremo de barra
windmills|Molinos
windmill|Molino
deadlifts|Peso muerto
deadlift|Peso muerto
pulldowns|Jalones
pulldown|Jalón
flyes|Aperturas
flye|Apertura
fly|Apertura
crunches|Encogimientos abdominales
crunch|Encogimiento abdominal
skull crusher|Press francés
skullcrusher|Press francés
pull-over|Extensión de hombros tumbado
pullover|Extensión de hombros tumbado
push press|Press con impulso
pushdown|Extensión hacia abajo
shrugs|Encogimientos de hombros
shrug|Encogimiento de hombros
clean and jerk|Cargada y envión
clean and press|Cargada y press
power clean|Cargada de potencia
hang clean|Cargada colgante
clean pull|Tirón de cargada
snatch pull|Tirón de arrancada
power snatch|Arrancada de potencia
hang snatch|Arrancada colgante
split jerk|Envión en tijera
power jerk|Envión de potencia
snatch balance|Equilibrio de arrancada
jerk balance|Equilibrio de envión
snatch|Arrancada
clean|Cargada
jerk|Envión
box jump|Salto al cajón
box skip|Subida con salto al cajón
depth jump|Salto en profundidad
long jump|Salto de longitud
star jump|Salto de estrella
rocket jump|Salto vertical explosivo
scissors jump|Salto en tijera
scissor kick|Patada de tijera
flutter kicks|Patadas alternas
front cone hops|Saltos frontales sobre conos
lateral cone hops|Saltos laterales sobre conos
hurdle hops|Saltos sobre vallas
frog hops|Saltos de rana
rope jumping|Salto de comba
rope climb|Trepa de cuerda
step ups|Subidas al banco
step-up|Subida al banco
butt kick|Talón al glúteo
walking lunge|Zancada caminando
reverse lunge|Zancada inversa
rear lunge|Zancada atrás
back lunge|Zancada atrás
lunges|Zancadas
lunge|Zancada
squats|Sentadillas
squat|Sentadilla
rows|Remo
row|Remo
curls|Flexiones de bíceps
curl|Flexión de bíceps
stretch|Estiramiento
stretching|Estiramiento
presses|Press
press|Press
raise|Elevación
raises|Elevaciones
throw|Lanzamiento
twists|Giros
twist|Giro
rotation|Rotación
rotations|Rotaciones
swing|Balanceo
swings|Balanceos
walk|Caminata
walking|Caminata
sprint|Carrera rápida
sprints|Carreras rápidas
kickback|Extensión hacia atrás
kickbacks|Extensiones hacia atrás
rollout|Extensión abdominal con rueda
roller|Rodillo
crucifix|Cruz
iron cross|Cruz de hierro
iron crosses|Cruces de hierro
plank|Plancha
hyperextensions|Extensiones de espalda
hyperextension|Extensión de espalda
back extensions|Extensiones de espalda
glute ham raise|Elevación de glúteos e isquiotibiales
glute-ham raise|Elevación de glúteos e isquiotibiales
pull through|Extensión de cadera entre las piernas
pull apart|Apertura de brazos
body-up|Subida de plancha
bodyweight|con peso corporal
body only|con peso corporal
body|corporal
with palms facing in|con agarre neutro
with palms in|con agarre neutro
palms facing in|con agarre neutro
palms-down|con palmas hacia abajo
palms-up|con palmas hacia arriba
palm-up|con palma hacia arriba
palms-in|con palmas hacia dentro
palm-in|con palma hacia dentro
pronated grip|con agarre prono
supinated|con agarre supino
pronated|con agarre prono
neutral grip|con agarre neutro
reverse grip|con agarre inverso
mixed grip|con agarre mixto
close-grip|con agarre cerrado
wide-grip|con agarre ancho
medium grip|con agarre medio
clean grip|con agarre de cargada
hammer grip|con agarre martillo
wide stance|con postura amplia
narrow stance|con postura estrecha
stiff-legged|con piernas semirrígidas
stiff leg|con piernas semirrígidas
stiff legs|con piernas semirrígidas
bent-arm|con brazos flexionados
straight-arm|con brazos extendidos
bent-knee|con rodillas flexionadas
bent leg|con pierna flexionada
one-armed|a un brazo
one-arm|a un brazo
one arm|a un brazo
single-arm|a un brazo
two-arm|a dos brazos
two arm|a dos brazos
one-legged|a una pierna
one legged|a una pierna
single-leg|a una pierna
single leg|a una pierna
one-leg|a una pierna
one leg|a una pierna
two-dumbbell|con dos mancuernas
two dumbbell|con dos mancuernas
two kettlebells|con dos pesas rusas
ez-bar|con barra Z
ez bar|con barra Z
smith machine|en máquina Smith
smith|en máquina Smith
exercise ball|con pelota de ejercicio
stability ball|con pelota de estabilidad
bosu ball|sobre bosu
medicine ball|con balón medicinal
calf-machine|en máquina de gemelos
leg press machine|en prensa de piernas
high-pulley|en polea alta
high pulley|en polea alta
low-pulley|en polea baja
low pulley|en polea baja
barbell|con barra
dumbbell|con mancuernas
db|con mancuernas
kettlebell|con pesa rusa
kettlebells|con pesas rusas
cable|en polea
band|con banda elástica
bands|con bandas elásticas
chains|con cadenas
chain|con cadena
machine|en máquina
leverage|en máquina de palancas
bar|con barra
rope|con cuerda
plate|con disco
floor|en el suelo
flat bench|en banco plano
incline bench|en banco inclinado
high bench|en banco alto
bench|en banco
on knees|de rodillas
behind the neck|tras nuca
behind neck|tras nuca
behind the head|detrás de la cabeza
behind head|detrás de la cabeza
behind the back|detrás de la espalda
with head on bench|con cabeza apoyada en banco
above head|sobre la cabeza
over head|sobre la cabeza
overhead|sobre la cabeza
below the knees|por debajo de las rodillas
below knees|por debajo de las rodillas
from blocks|desde bloques
off pins|desde soportes
full range-of-motion|con recorrido completo
range-of-motion|recorrido
extended range|con recorrido ampliado
bent over|con torso inclinado
bent-over|con torso inclinado
seated|sentado
standing|de pie
lying|tumbado
kneeling|de rodillas
hanging|colgado
hang|desde suspensión
prone|boca abajo
supine|boca arriba
face down|boca abajo
face up|boca arriba
side-lying|tumbado de lado
incline|inclinado
decline|declinado
alternating|alterno
alternate|alterno
reverse|inverso
front|frontal
rear|posterior
side|lateral
lateral|lateral
double|doble
single|individual
weighted|con lastre
assisted|asistido
elevated|elevado
full|completo
natural|natural
dynamic|dinámico
isometric|isométrico
intermediate|nivel intermedio
advanced|avanzado
external|externa
internal|interna
rotation|Rotación
triceps|tríceps
tricep|tríceps
biceps|bíceps
bicep|bíceps
ab|abdominal
abdominals|abdominales
hamstring|isquiotibiales
hamstrings|isquiotibiales
quad|cuádriceps
quadriceps|cuádriceps
calves|gemelos
calf|gemelos
chest|pecho
shoulder|hombro
shoulders|hombros
deltoid|deltoides
rear delt|deltoides posterior
front deltoid|deltoides anterior
glute|glúteo
glutes|glúteos
adductor|aductor
adduction|aducción
groin|ingle
hip flexor|flexor de cadera
hip flexors|flexores de cadera
hip|cadera
lower back|zona lumbar
middle back|espalda media
upper back|espalda alta
back|espalda
neck|cuello
elbow|codo
elbows|codos
knee|rodilla
knees|rodillas
leg|pierna
legs|piernas
arm|brazo
arms|brazos
foot|pie
wrist|muñeca
forearm|antebrazo
anterior tibialis|tibial anterior
posterior tibialis|tibial posterior
peroneals|peroneos
piriformis|piriforme
rhomboids|romboides
latissimus dorsi|dorsal ancho
iliotibial tract|banda iliotibial
it band|banda iliotibial
brachialis|braquial
smr|automasaje miofascial
pelvic tilt|Basculación pélvica
extension|Extensión
extended|extendida
resistance|resistencia
hand harness|arnés de mano
head harness|arnés de cabeza
against wall|contra pared
against an incline|contra superficie inclinada
against|contra
on the floor|en el suelo
on the knee|sobre la rodilla
on the|sobre
on a|sobre
on an|sobre
with|con
and|y
from|desde
to|hacia
over|sobre
off of|sobre
of|de
the|el
into|hacia
in|en
on|sobre
a|una
an|una
or|o
no|sin
'''
exact='''
Ab Crunch Machine|Encogimiento abdominal en máquina
Adductor|Automasaje de aductores
Adductor/Groin|Estiramiento de aductores e ingles
Barbell Ab Rollout|Extensión abdominal con barra
Barbell Ab Rollout - On Knees|Extensión abdominal con barra de rodillas
Barbell Full Squat|Sentadilla profunda con barra
Barbell Bench Press - Medium Grip|Press de banca con barra y agarre medio
Barbell Incline Bench Press - Medium Grip|Press de banca inclinado con barra y agarre medio
Dumbbell Bench Press|Press de banca con mancuernas
Machine Bench Press|Press de banca en máquina
Bench Press - With Bands|Press de banca con bandas elásticas
Bench Press with Chains|Press de banca con cadenas
Decline Barbell Bench Press|Press de banca declinado con barra
Decline Dumbbell Bench Press|Press de banca declinado con mancuernas
Barbell Squat|Sentadilla con barra
Dumbbell Squat|Sentadilla con mancuernas
Bodyweight Squat|Sentadilla con peso corporal
Barbell Deadlift|Peso muerto con barra
Bent Over Barbell Row|Remo con barra y torso inclinado
Bent Over Two-Dumbbell Row|Remo con mancuernas y torso inclinado
One-Arm Dumbbell Row|Remo a un brazo con mancuerna
Seated Cable Rows|Remo sentado en polea
Wide-Grip Lat Pulldown|Jalón al pecho con agarre ancho
Close-Grip Front Lat Pulldown|Jalón al pecho con agarre cerrado
Incline Dumbbell Press|Press inclinado con mancuernas
Dumbbell Shoulder Press|Press de hombros con mancuernas
Seated Dumbbell Press|Press sentado con mancuernas
Barbell Shoulder Press|Press de hombros con barra
Dumbbell Flyes|Aperturas de pecho con mancuernas
Incline Dumbbell Flyes|Aperturas de pecho inclinadas con mancuernas
Side Lateral Raise|Elevación lateral de hombros
Dumbbell Bicep Curl|Flexión de bíceps con mancuernas
Barbell Curl|Flexión de bíceps con barra
EZ-Bar Curl|Flexión de bíceps con barra Z
Lying Leg Curls|Flexión de piernas tumbado
Seated Leg Curl|Flexión de piernas sentado
Leg Press|Prensa de piernas
Leg Extensions|Extensión de piernas en máquina
Lying Machine Squat|Sentadilla tumbado en máquina
Standing Calf Raises|Elevación de talones de pie
Seated Calf Raise|Elevación de talones sentado
Back Flyes - With Bands|Aperturas posteriores con bandas
Band Good Morning (Pull Through)|Buenos días con banda entre las piernas
Barbell Guillotine Bench Press|Press de banca guillotina con barra
Decline Oblique Crunch|Encogimiento oblicuo declinado
High Cable Curls|Flexión de bíceps en poleas altas
Incline Bench Pull|Remo tumbado en banco inclinado
Incline Inner Biceps Curl|Flexión de bíceps interior en banco inclinado
Incline Push-Up Medium|Flexión inclinada con separación media de manos
Incline Push-Up Wide|Flexión inclinada con manos separadas
Inverted Row|Remo invertido
Inverted Row with Straps|Remo invertido con correas
Kneeling Cable Crunch With Alternating Oblique Twists|Encogimiento abdominal de rodillas en polea con giros oblicuos alternos
Leverage High Row|Remo alto en máquina de palancas
Linear Depth Jump|Salto lineal en profundidad
Low Cable Triceps Extension|Extensión de tríceps en polea baja
Machine Shoulder (Military) Press|Press militar en máquina
Oblique Crunches|Encogimientos abdominales oblicuos
Oblique Crunches - On The Floor|Encogimientos oblicuos en el suelo
One-Arm Kettlebell Split Snatch|Arrancada en tijera a un brazo con pesa rusa
Pelvic Tilt Into Bridge|Basculación pélvica con puente
Push-Up Wide|Flexión de brazos con manos separadas
Push-Ups - Close Triceps Position|Flexiones con manos juntas para tríceps
Push-Ups With Feet Elevated|Flexiones con pies elevados
Push-Ups With Feet On An Exercise Ball|Flexiones con pies sobre pelota
Seated Close-Grip Concentration Barbell Curl|Flexión concentrada de bíceps sentado con barra y agarre cerrado
Seated Dumbbell Inner Biceps Curl|Flexión de bíceps interior sentado con mancuernas
Seated One-arm Cable Pulley Rows|Remo sentado a un brazo en polea
Single-Arm Cable Crossover|Cruce de polea a un brazo
Single-Leg High Box Squat|Sentadilla a una pierna sobre cajón alto
Split Squat with Dumbbells|Sentadilla dividida con mancuernas
Standing Gastrocnemius Calf Stretch|Estiramiento de gastrocnemio de pie
Standing Inner-Biceps Curl|Flexión de bíceps interior de pie
Sumo Deadlift|Peso muerto sumo
Sumo Deadlift with Bands|Peso muerto sumo con bandas elásticas
Sumo Deadlift with Chains|Peso muerto sumo con cadenas
Upright Barbell Row|Remo al mentón con barra
Upright Cable Row|Remo al mentón en polea
3/4 Sit-Up|Abdominal con recorrido de tres cuartos
90/90 Hamstring|Estiramiento de isquiotibiales 90/90
Ab Roller|Rueda abdominal
Air Bike|Bicicleta abdominal
All Fours Quad Stretch|Estiramiento de cuádriceps en cuadrupedia
Alternate Heel Touchers|Toques alternos de talones
Alternate Leg Diagonal Bound|Saltos diagonales alternos
Ankle On The Knee|Estiramiento de glúteo con tobillo sobre rodilla
Anti-Gravity Press|Press antigravedad
Arnold Dumbbell Press|Press Arnold con mancuernas
Around The Worlds|Aperturas circulares con mancuernas
Atlas Stone Trainer|Simulador de piedras Atlas
Atlas Stones|Levantamiento de piedras Atlas
Axle Deadlift|Peso muerto con barra de eje grueso
Backward Drag|Arrastre hacia atrás
Backward Medicine Ball Throw|Lanzamiento de balón medicinal hacia atrás
Balance Board|Equilibrio sobre tabla
Ball Leg Curl|Flexión de piernas sobre pelota
Battling Ropes|Ondas con cuerdas de entrenamiento
Bear Crawl Sled Drags|Arrastre de trineo en cuadrupedia
Bench Dips|Fondos en banco
Bench Jump|Salto al banco
Bench Press - Powerlifting|Press de banca de competición
Bench Sprint|Carrera alterna sobre banco
Bent Press|Press lateral con inclinación del tronco
Bicycling|Ciclismo
Bicycling, Stationary|Bicicleta estática
Board Press|Press de banca con tabla
Bodyweight Mid Row|Remo medio con peso corporal
Bottoms-Up Clean From The Hang Position|Cargada colgante con base de la pesa hacia arriba
Bottoms Up|Elevación invertida de cadera
Box Jump (Multiple Response)|Saltos repetidos al cajón
Brachialis-SMR|Automasaje miofascial del braquial
Bradford/Rocky Presses|Press Bradford / Rocky
Butt-Ups|Elevación de cadera en plancha
Butt Lift (Bridge)|Puente de glúteos
Butterfly|Aperturas de pecho en máquina
Cable Crossover|Cruce de poleas
Cable Hammer Curls - Rope Attachment|Flexión de bíceps en polea con cuerda y agarre martillo
Cable Judo Flip|Giro de judo en polea
Cable Rear Delt Fly|Aperturas posteriores en polea
Cable Russian Twists|Giros rusos en polea
Calf Stretch Elbows Against Wall|Estiramiento de gemelos con codos contra la pared
Calf Stretch Hands Against Wall|Estiramiento de gemelos con manos contra la pared
Car Deadlift|Peso muerto con coche
Car Drivers|Giros de volante con disco
Carioca Quick Step|Desplazamiento lateral cruzado
Cat Stretch|Estiramiento del gato
Catch and Overhead Throw|Recepción y lanzamiento sobre la cabeza
Chain Handle Extension|Extensión con agarres de cadena
Chair Leg Extended Stretch|Estiramiento con pierna extendida en silla
Chair Lower Back Stretch|Estiramiento lumbar en silla
Chair Squat|Sentadilla a silla
Chair Upper Body Stretch|Estiramiento del torso en silla
Chest And Front Of Shoulder Stretch|Estiramiento de pecho y hombro anterior
Chest Push from 3 point stance|Lanzamiento de pecho desde apoyo en tres puntos
Chest Push (multiple response)|Lanzamientos repetidos de pecho
Chest Push (single response)|Lanzamiento individual de pecho
Chest Push with Run Release|Lanzamiento de pecho con carrera
Child's Pose|Postura del niño
Chin To Chest Stretch|Estiramiento cervical con barbilla al pecho
Circus Bell|Press con mancuerna de circo
Clock Push-Up|Flexión de brazos en reloj
Cocoons|Abdominal encogido completo
Conan's Wheel|Rueda de Conan
Cross-Body Crunch|Encogimiento abdominal cruzado
Cross Body Hammer Curl|Flexión de bíceps martillo cruzada
Cross Over - With Bands|Cruce de brazos con bandas elásticas
Crossover Reverse Lunge|Zancada inversa cruzada
Crunch - Hands Overhead|Encogimiento abdominal con manos sobre la cabeza
Cuban Press|Press cubano
Dancer's Stretch|Estiramiento del bailarín
Dead Bug|Bicho muerto: extensión alterna en supino
Deficit Deadlift|Peso muerto desde déficit
Depth Jump Leap|Salto en profundidad con impulso
Dip Machine|Fondos en máquina
Dips - Chest Version|Fondos para pecho
Dips - Triceps Version|Fondos para tríceps
Donkey Calf Raises|Elevación de gemelos con torso inclinado
Downward Facing Balance|Equilibrio boca abajo
Drag Curl|Flexión de bíceps con arrastre
Drop Push|Lanzamiento desde caída
Dumbbell Lying Pronation|Pronación tumbado con mancuerna
Dumbbell Lying Supination|Supinación tumbado con mancuerna
Dumbbell Scaption|Elevación escapular con mancuernas
Elbow to Knee|Codo a rodilla
Elbows Back|Apertura de codos hacia atrás
Elliptical Trainer|Elíptica
Exercise Ball Pull-In|Recogida de piernas sobre pelota
Face Pull|Tirón a la cara
Farmer's Walk|Paseo del granjero
Fast Skipping|Elevación rápida de rodillas
Finger Curls|Flexión de dedos
Flexor Incline Dumbbell Curls|Flexión de bíceps inclinado con mancuernas y muñeca flexionada
Forward Drag with Press|Arrastre frontal con press
Frankenstein Squat|Sentadilla Frankenstein
Freehand Jump Squat|Sentadilla con salto sin carga
Frog Sit-Ups|Abdominal de rana
Front Cone Hops (or hurdle hops)|Saltos frontales sobre conos o vallas
Gironda Sternum Chins|Dominada Gironda al esternón
Gorilla Chin/Crunch|Dominada con encogimiento abdominal
Groiners|Apertura dinámica de cadera en plancha
Handstand Push-Ups|Flexiones en pino
Hanging Pike|Elevación de piernas rectas colgado
Heaving Snatch Balance|Equilibrio de arrancada con impulso
Heavy Bag Thrust|Empuje de saco pesado
Hug A Ball|Estiramiento abrazando una pelota
Hug Knees To Chest|Rodillas al pecho
Hyperextensions With No Hyperextension Bench|Extensión de espalda sin banco específico
Inchworm|Caminata de manos tipo gusano
Incline Dumbbell Bench With Palms Facing In|Press inclinado con mancuernas y agarre neutro
Isometric Chest Squeezes|Contracción isométrica de pecho
Isometric Neck Exercise - Front And Back|Isométricos cervicales frontales y posteriores
Isometric Neck Exercise - Sides|Isométricos cervicales laterales
Isometric Wipers|Limpiaparabrisas isométricos
JM Press|Press JM
Jackknife Sit-Up|Abdominal en V
Janda Sit-Up|Abdominal Janda
Jefferson Squats|Sentadilla Jefferson
Jerk Dip Squat|Flexión de piernas preparatoria para envión
Jogging, Treadmill|Trote en cinta
Keg Load|Carga de barril
Kettlebell Arnold Press|Press Arnold con pesa rusa
Kettlebell Dead Clean|Cargada con pesa rusa desde el suelo
Kettlebell Figure 8|Ocho con pesa rusa
Kettlebell Halo|Halo con pesa rusa
Kettlebell Halo with Overhead Extension|Halo con pesa rusa y extensión sobre la cabeza
Kettlebell Pass Between The Legs|Paso de pesa rusa entre las piernas
Kettlebell Pirate Ships|Balanceo lateral con pesa rusa
Kettlebell Seesaw Press|Press alterno basculante con pesas rusas
Kettlebell Sumo High Pull|Tirón alto sumo con pesa rusa
Kettlebell Thruster|Sentadilla con press de pesa rusa
Kettlebell Turkish Get-Up (Lunge style)|Levantamiento turco con pesa rusa y zancada
Kettlebell Turkish Get-Up (Squat style)|Levantamiento turco con pesa rusa y sentadilla
Kipping Muscle Up|Dominada con transición sobre barra e impulso
Knee Across The Body|Rodilla cruzada sobre el cuerpo
Knee/Hip Raise On Parallel Bars|Elevación de rodillas y cadera en paralelas
Knee Tuck Jump|Salto con rodillas al pecho
Kneeling Arm Drill|Balanceo de brazos de rodillas
Landmine 180's|Giro de 180 grados con barra anclada
Landmine Linear Jammer|Empuje lineal con barra anclada
Lateral Bound|Salto lateral amplio
Leg-Over Floor Press|Press en suelo con pierna cruzada
Leg-Up Hamstring Stretch|Estiramiento de isquiotibiales con pierna elevada
Leverage Iso Row|Remo aislado en máquina de palancas
Linear 3-Part Start Technique|Salida lineal en tres fases
Linear Acceleration Wall Drill|Aceleración lineal con apoyo en pared
Log Lift|Levantamiento de tronco
London Bridges|Descenso y ascenso en cuerda inclinada
Looking At Ceiling|Extensión cervical mirando al techo
Low Cable Crossover|Cruce de poleas bajas
Lunge Pass Through|Zancada con paso de pesa entre piernas
Lying Cambered Barbell Row|Remo tumbado con barra curvada
Lying Crossover|Cruce de piernas tumbado
Medicine Ball Chest Pass|Pase de pecho con balón medicinal
Medicine Ball Full Twist|Giro completo con balón medicinal
Medicine Ball Scoop Throw|Lanzamiento de balón medicinal desde abajo
Monster Walk|Caminata lateral con banda
Mountain Climbers|Escaladores
Moving Claw Series|Secuencia de zancadas con movimiento de garra
Muscle Snatch|Arrancada de fuerza
Muscle Up|Dominada con transición sobre barra
Neck Press|Press de banca al cuello
Olympic Squat|Sentadilla olímpica
On-Your-Back Quad Stretch|Estiramiento de cuádriceps boca arriba
On Your Side Quad Stretch|Estiramiento de cuádriceps de lado
One-Arm Kettlebell Para Press|Press inclinado a un brazo con pesa rusa
One-Arm Medicine Ball Slam|Lanzamiento de balón medicinal al suelo con un brazo
One-Arm Open Palm Kettlebell Clean|Cargada con pesa rusa a palma abierta y un brazo
One Half Locust|Postura de media langosta
One Handed Hang|Suspensión a una mano
One Knee To Chest|Una rodilla al pecho
Open Palm Kettlebell Clean|Cargada con pesa rusa a palma abierta
Otis-Up|Abdominal Otis con carga
Overhead Lat|Estiramiento dorsal sobre la cabeza
Overhead Slam|Lanzamiento al suelo desde encima de la cabeza
Pallof Press|Press Pallof
Pallof Press With Rotation|Press Pallof con rotación
Parallel Bar Dip|Fondos en barras paralelas
Physioball Hip Bridge|Puente de cadera sobre pelota
Pin Presses|Press desde soportes
Plate Pinch|Pinza de discos
Platform Hamstring Slides|Deslizamiento de isquiotibiales sobre plataforma
Plie Dumbbell Squat|Sentadilla plié con mancuerna
Plyo Kettlebell Pushups|Flexiones pliométricas sobre pesas rusas
Plyo Push-up|Flexión pliométrica
Power Partials|Elevaciones laterales parciales
Power Stairs|Subida de escalones con carga
Preacher Hammer Dumbbell Curl|Flexión martillo con mancuernas en banco predicador
Prone Manual Hamstring|Flexión de isquiotibiales boca abajo con resistencia manual
Prowler Sprint|Carrera con trineo de empuje
Pushups (Close and Wide Hand Positions)|Flexiones alternando manos juntas y separadas
Pyramid|Postura de pirámide
Quick Leap|Salto rápido
Rack Delivery|Recepción de barra en posición frontal
Rack Pull with Bands|Peso muerto desde soportes con bandas
Rack Pulls|Peso muerto desde soportes
Recumbent Bike|Bicicleta reclinada
Return Push from Stance|Lanzamiento de pecho con retorno desde posición de salida
Reverse Band Bench Press|Press de banca con bandas de descarga
Reverse Band Box Squat|Sentadilla a cajón con bandas de descarga
Reverse Band Deadlift|Peso muerto con bandas de descarga
Reverse Band Power Squat|Sentadilla de potencia con bandas de descarga
Reverse Band Sumo Deadlift|Peso muerto sumo con bandas de descarga
Reverse Triceps Bench Press|Press de banca con agarre inverso para tríceps
Rickshaw Carry|Paseo con bastidor de carga
Rickshaw Deadlift|Peso muerto con bastidor de carga
Ring Dips|Fondos en anillas
Rocking Standing Calf Raise|Elevación oscilante de gemelos de pie
Rocky Pull-Ups/Pulldowns|Dominadas o jalones Rocky
Romanian Deadlift|Peso muerto rumano
Romanian Deadlift from Deficit|Peso muerto rumano desde déficit
Round The World Shoulder Stretch|Estiramiento circular de hombros
Rowing, Stationary|Remo en ergómetro
Runner's Stretch|Estiramiento del corredor
Running, Treadmill|Carrera en cinta
Russian Twist|Giro ruso
Sandbag Load|Carga de saco de arena
Scapular Pull-Up|Dominada escapular
Seated Front Deltoid|Estiramiento del deltoides anterior sentado
See-Saw Press (Alternating Side Press)|Press lateral alterno basculante
Shotgun Row|Remo unilateral con giro
Side Hop-Sprint|Salto lateral con carrera rápida
Side Jackknife|Abdominal lateral en V
Side To Side Chins|Dominadas supinas de lado a lado
Side Wrist Pull|Tracción lateral de muñeca
Side to Side Box Shuffle|Pasos laterales sobre cajón
Single-Arm Linear Jammer|Empuje lineal con barra anclada a un brazo
Single-Cone Sprint Drill|Carrera rápida alrededor de un cono
Single-Leg Hop Progression|Progresión de saltos a una pierna
Single-Leg Lateral Hop|Salto lateral a una pierna
Single-Leg Stride Jump|Salto de zancada a una pierna
Single Leg Push-off|Impulso a una pierna
Sit Squats|Sentadilla desde posición sentada
Skating|Patinaje
Sled Drag - Harness|Arrastre de trineo con arnés
Sled Overhead Backward Walk|Caminata hacia atrás con trineo y brazos elevados
Sled Overhead Triceps Extension|Extensión de tríceps sobre la cabeza con trineo
Sled Push|Empuje de trineo
Sled Reverse Flye|Apertura inversa con trineo
Sled Row|Remo con trineo
Sledgehammer Swings|Golpes con maza
Speed Band Overhead Triceps|Extensión rápida de tríceps sobre la cabeza con banda
Speed Box Squat|Sentadilla rápida a cajón
Speed Squats|Sentadillas rápidas
Spell Caster|Giro diagonal con mancuernas
Spider Crawl|Desplazamiento de araña
Spinal Stretch|Estiramiento de columna
Split Clean|Cargada en tijera
Split Jump|Salto en tijera
Split Snatch|Arrancada en tijera
Squat Jerk|Envión con sentadilla
Squat with Plate Movers|Sentadilla con desplazamiento de discos
Stairmaster|Máquina de escaleras
Standing Bradford Press|Press Bradford de pie
Standing Cable Lift|Elevación diagonal en polea de pie
Standing Cable Wood Chop|Giro diagonal tipo leñador en polea de pie
Standing Olympic Plate Hand Squeeze|Presión de disco olímpico con las manos de pie
Standing Pelvic Tilt|Basculación pélvica de pie
Standing Soleus And Achilles Stretch|Estiramiento de sóleo y tendón de Aquiles de pie
Standing Toe Touches|Toques de puntas de los pies de pie
Standing Towel Triceps Extension|Extensión de tríceps con toalla de pie
Standing Two-Arm Overhead Throw|Lanzamiento sobre la cabeza a dos brazos de pie
Step-up with Knee Raise|Subida a banco con elevación de rodilla
Step Mill|Máquina de escalones
Stomach Vacuum|Vacío abdominal
Straight Bar Bench Mid Rows|Remo medio con barra recta y banco
Straight Raises on Incline Bench|Elevaciones de brazos rectos sobre banco inclinado
Stride Jump Crossover|Salto de zancada cruzado
Superman|Extensión de tronco Superman
Suspended Fallout|Extensión abdominal en suspensión
Suspended Push-Up|Flexión de brazos en suspensión
Suspended Reverse Crunch|Encogimiento abdominal inverso en suspensión
Suspended Row|Remo en suspensión
Suspended Split Squat|Sentadilla dividida en suspensión
Svend Press|Press Svend
T-Bar Row with Handle|Remo con barra T y agarre
Tate Press|Press Tate
The Straddle|Estiramiento sentado con piernas abiertas
Thigh Abductor|Abducción de cadera en máquina
Thigh Adductor|Aducción de cadera en máquina
Tire Flip|Volteo de neumático
Toe Touchers|Toques de pies con piernas elevadas
Torso Rotation|Rotación de torso
Trail Running/Walking|Carrera o caminata por senderos
Trap Bar Deadlift|Peso muerto con barra hexagonal
Tricep Dumbbell Kickback|Extensión de tríceps hacia atrás con mancuerna
Triceps Pushdown - Rope Attachment|Extensión de tríceps en polea con cuerda
Triceps Pushdown - V-Bar Attachment|Extensión de tríceps en polea con barra V
Tuck Crunch|Encogimiento abdominal con piernas recogidas
Underhand Cable Pulldowns|Jalón en polea con agarre supino
Upper Back-Leg Grab|Estiramiento dorsal agarrando las piernas
Upward Stretch|Estiramiento hacia arriba
V-Bar Pulldown|Jalón con barra V
V-Bar Pullup|Dominada con agarre V
Vertical Swing|Balanceo vertical
Walking, Treadmill|Caminata en cinta
Weighted Ball Hyperextension|Extensión de espalda sobre pelota con lastre
Weighted Ball Side Bend|Flexión lateral sobre pelota con lastre
Weighted Bench Dip|Fondos en banco con lastre
Wind Sprints|Carreras rápidas por intervalos
World's Greatest Stretch|Estiramiento global con zancada y rotación
Wrist Roller|Rodillo de muñecas
Wrist Rotations with Straight Bar|Rotaciones de muñeca con barra recta
Yoke Walk|Paseo con yugo
Zercher Squats|Sentadilla Zercher
Zottman Curl|Flexión de bíceps Zottman
Zottman Preacher Curl|Flexión de bíceps Zottman en banco predicador
'''
dictionary=dict(line.split('|',1) for line in phrases.strip().splitlines())
overrides=dict(line.split('|',1) for line in exact.strip().splitlines())
pattern=re.compile(r'(?<![a-z])('+ '|'.join(re.escape(k) for k in sorted(dictionary,key=len,reverse=True))+r')(?![a-z])',re.I)
unknown=[]
def translate(name):
    if name in overrides:return overrides[name]
    found=[]
    def sub(m):
        found.append(dictionary[m[0].lower()]);return ' '
    remaining=pattern.sub(sub,name).strip(' -()/,')
    if re.search('[A-Za-z]',remaining):unknown.append((name,remaining))
    # Capitalized movement names precede qualifiers, without changing movement semantics.
    found=[p for p in found if p not in {'con','y','desde','hacia','sobre','de','el','en','una','o','sin','contra'}]
    parts=[p for p in found if p[:1].isupper()]+[p for p in found if not p[:1].isupper()]
    if remaining:parts.append(remaining)
    label=' · '.join(parts)
    return label[:1].upper()+label[1:]
names={x['id']:translate(x.get('originalName',x['name'])) for x in items}
if unknown:
    print('\n'.join(a+' => '+b for a,b in unknown));raise SystemExit(f'{len(unknown)} pending names')
out=root/'www/exercises-es22.js'
out.write_text('/* Spanish display names; original IDs and English aliases remain searchable. */\nconst VeraExerciseNames22='+json.dumps(names,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
for x in items:
    x['originalName']=x.get('originalName',x['name']);x['name']=names[x['id']]
(root/'www/exercises.json').write_text(json.dumps(items,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print(f'{len(names)} Spanish exercise names generated.')
