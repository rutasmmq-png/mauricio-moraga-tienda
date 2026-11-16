-- ════════════════════════════════════════════════════════════════
--  Datos iniciales · ejecutar DESPUÉS de schema.sql
--  Todo esto se puede editar luego desde el panel /admin
-- ════════════════════════════════════════════════════════════════

insert into languages (code, name_es, name_en, name_hi, sort) values
  ('es','Español','Spanish','स्पेनिश',1),
  ('en','Inglés','English','अंग्रेज़ी',2),
  ('hi','Hindi','Hindi','हिन्दी',3)
on conflict (code) do nothing;

insert into categories (slug, name_es, name_en, name_hi, sort) values
  ('superacion-personal','Superación personal','Personal growth','आत्म-विकास',1),
  ('familia-y-generaciones','Familia y generaciones','Family & generations','परिवार और पीढ़ियाँ',2),
  ('matrimonio','Matrimonio y pareja','Marriage & relationships','विवाह और संबंध',3),
  ('oracion-y-estudio-biblico','Oración y estudio bíblico','Prayer & Bible study','प्रार्थना और बाइबल अध्ययन',4),
  ('estimulacion-cognitiva','Estimulación cognitiva','Cognitive stimulation','संज्ञानात्मक उत्तेजना',5)
on conflict (slug) do nothing;

-- ─── Libros ───
insert into books (slug, title, subtitle, short_description, long_description, cover_url, language_code, category_id, formats, price, currency, status, featured, is_new, sort, seo_description) values
(
  'the-secret-to-success',
  'The Secret to Success',
  'Break Free from Family Karma to Be Happy',
  'A personal-growth book on how family patterns shape your life, with principles to break negative cycles and move toward a fuller life.',
  E'Why does success always seem out of reach, even when you work hard and do good?\n\nPerhaps the answer does not lie only in you, but in the unresolved stories of your lineage. This book explores how mistakes, silences, broken promises and inherited pain can become invisible chains that block prosperity, love and peace — and how to break them.\n\nInside you will learn to identify the repetitive patterns that hold you back, find practical and spiritual tools to cut those ties, and follow a 7-day plan to begin your transformation.',
  '/covers/the-secret-to-success.jpg', 'en',
  (select id from categories where slug='superacion-personal'),
  '{kindle,impreso}', 6.99, 'USD', 'published', true, false, 1,
  'The Secret to Success by Mauricio Moraga Quezada: break free from family karma and inherited patterns to live a happier, fuller life. Kindle and paperback.'
),
(
  'el-secreto-del-exito',
  'El Secreto del Éxito',
  'Rompe con las Maldiciones Generacionales para Ser Feliz',
  'Descubre cómo los patrones familiares influyen en tu vida y aplica principios para romper ciclos negativos y avanzar hacia una vida más plena.',
  E'¿Por qué el éxito parece escaparse aun cuando trabajas duro y haces el bien?\n\nTal vez la respuesta no esté solo en ti, sino en las historias no resueltas de tu linaje. Este libro muestra cómo los errores, silencios, promesas rotas y heridas heredadas pueden convertirse en cadenas invisibles que bloquean la prosperidad, el amor y la paz.\n\nAprenderás a reconocer los patrones que se repiten en tu familia, recibirás herramientas prácticas y espirituales para romperlos y un plan de 7 días para comenzar tu transformación.',
  '/covers/el-secreto-del-exito.jpg', 'es',
  (select id from categories where slug='superacion-personal'),
  '{digital,pdf}', null, 'USD', 'published', true, true, 2,
  'El Secreto del Éxito, de Mauricio Moraga Quezada: rompe con las maldiciones generacionales y los patrones familiares para ser feliz.'
),
(
  'the-secret-to-success-hindi',
  'सफलता का रहस्य',
  'The Secret to Success – Hindi Edition · परिवार के कर्म से मुक्त होकर खुश रहो',
  'पारिवारिक पैटर्न आपके जीवन को कैसे प्रभावित करते हैं, और नकारात्मक चक्रों को तोड़कर एक पूर्ण जीवन की ओर कैसे बढ़ें।',
  E'कड़ी मेहनत और अच्छे कर्म के बावजूद सफलता दूर क्यों लगती है?\n\nयह पुस्तक बताती है कि पूर्वजों की गलतियाँ, चुप्पियाँ और विरासत में मिला दर्द कैसे अदृश्य बेड़ियाँ बन जाते हैं — और उन्हें कैसे तोड़ा जाए।',
  '/covers/the-secret-to-success-hindi.jpg', 'hi',
  (select id from categories where slug='superacion-personal'),
  '{digital}', null, 'USD', 'published', true, true, 3, null
),
(
  'metodo-vinculum-21',
  'Método Vinculum 21™',
  '21 días para un matrimonio más fuerte, más real y más cerca de Dios',
  'Método digital basado en principios bíblicos para trabajar en la restauración matrimonial y fortalecer la relación de pareja.',
  E'¿Viven juntos, pero cada vez más lejos? Las discusiones repetitivas, el resentimiento y el silencio pueden levantar una distancia invisible en el matrimonio.\n\nVinculum 21™ es un proceso bíblico y práctico de 21 días para trabajar la comunicación, el perdón y la reconexión en pareja.\n\nIncluye como regalo el Cuaderno de Trabajo y Dinámicas en Pareja, con ejercicios, reflexiones y planes de acción para llevar el contenido a la vida real.',
  '/covers/metodo-vinculum-21.jpg', 'es',
  (select id from categories where slug='matrimonio'),
  '{digital}', null, 'USD', 'published', true, true, 4,
  'Método Vinculum 21™: proceso bíblico y práctico de 21 días para restaurar y fortalecer tu matrimonio.'
),
(
  'herencia-con-maldicion',
  'Herencia con Maldición',
  'Conoce las maldiciones de tu familia',
  'Un estudio para identificar los patrones que se repiten de generación en generación y aprender a romperlos desde los principios bíblicos.',
  null,
  '/covers/herencia-con-maldicion.jpg', 'es',
  (select id from categories where slug='familia-y-generaciones'),
  '{digital}', null, 'USD', 'published', false, false, 5, null
),
(
  'inheritance-with-curses',
  'Inheritance with Curses',
  'Know the Curse in Your Family',
  'A study to identify the patterns repeated from generation to generation in your family and learn how to break them.',
  null,
  '/covers/inheritance-with-curses.jpg', 'en',
  (select id from categories where slug='familia-y-generaciones'),
  '{kindle}', null, 'USD', 'published', false, false, 6, null
),
(
  'guia-de-oraciones-por-necesidad',
  'Guía de Oraciones por Necesidad',
  'Cómo orar a Dios según cada circunstancia de la vida',
  'Oraciones para más de 30 circunstancias de la vida, desde la gracia del Nuevo Testamento y las raíces hebreas de nuestra fe.',
  null,
  '/covers/guia-de-oraciones-por-necesidad.jpg', 'es',
  (select id from categories where slug='oracion-y-estudio-biblico'),
  '{digital,pdf}', null, 'USD', 'draft', false, false, 7, null
),
(
  'mente-activa-corazon-chileno',
  'Mente Activa, Corazón Chileno',
  'Cuadernillo de estimulación cognitiva para personas mayores',
  'Material de estimulación cognitiva diseñado desde la realidad chilena: recuerdos, tradiciones y cultura para mantener la mente activa.',
  null,
  '/covers/mente-activa-corazon-chileno.jpg', 'es',
  (select id from categories where slug='estimulacion-cognitiva'),
  '{impreso,pdf}', null, 'CLP', 'draft', false, false, 8, null
)
on conflict (slug) do nothing;

-- ─── Opciones de venta ───
-- The Secret to Success (Kindle): ASIN B0FTZWZK9W, enlace confirmado por el autor.
-- Herencia con Maldición (Kindle): ASIN B0DB1FFGBN, enlace confirmado por el autor.
-- La edición impresa queda inactiva hasta cargar su enlace en el panel.
-- Inheritance with Curses (Kindle): ASIN B0DSJXQWVG, enlace confirmado por el autor.
-- Las opciones sin precio o sin enlace se crean INACTIVAS: actívalas al completarlas.
insert into sales_offers (book_id, platform, label, format, url, price, currency, delivery, active, sort)
select id, 'amazon', 'Amazon Kindle', 'kindle',
  'https://www.amazon.com/dp/B0FTZWZK9W', 6.99, 'USD', 'digital', true, 1
from books where slug='the-secret-to-success'
  and not exists (select 1 from sales_offers o join books b on b.id=o.book_id where b.slug='the-secret-to-success' and o.label='Amazon Kindle');

insert into sales_offers (book_id, platform, label, format, url, price, currency, delivery, active, sort)
select id, 'amazon', 'Amazon – Libro impreso', 'impreso',
  null, null, 'USD', 'physical', false, 2
from books where slug='the-secret-to-success'
  and not exists (select 1 from sales_offers o join books b on b.id=o.book_id where b.slug='the-secret-to-success' and o.label='Amazon – Libro impreso');

insert into sales_offers (book_id, platform, label, format, url, price, currency, delivery, active, sort)
select id, 'direct', 'PDF – Compra directa', 'pdf', null, null, 'USD', 'digital', false, 1
from books where slug in ('el-secreto-del-exito','the-secret-to-success-hindi','herencia-con-maldicion')
  and not exists (select 1 from sales_offers o where o.book_id = books.id and o.platform='direct');

insert into sales_offers (book_id, platform, label, format, url, price, currency, delivery, active, sort)
select id, 'hotmart', 'Hotmart', 'digital', 'https://go.hotmart.com/S107696983W', null, 'USD', 'digital', true, 1
from books where slug='metodo-vinculum-21'
  and not exists (select 1 from sales_offers o where o.book_id = books.id and o.platform='hotmart');

insert into sales_offers (book_id, platform, label, format, url, price, currency, delivery, active, sort)
select id, 'amazon', 'Amazon Kindle', 'kindle',
  'https://www.amazon.com/dp/B0DSJXQWVG', null, 'USD', 'digital', true, 1
from books where slug='inheritance-with-curses'
  and not exists (select 1 from sales_offers o where o.book_id = books.id and o.platform='amazon');

insert into sales_offers (book_id, platform, label, format, url, price, currency, delivery, active, sort)
select id, 'amazon', 'Amazon Kindle', 'kindle', 'https://www.amazon.com/dp/B0DB1FFGBN', null, 'USD', 'digital', true, 0
from books where slug='herencia-con-maldicion'
  and not exists (select 1 from sales_offers o where o.book_id = books.id and o.platform='amazon');
update books set formats = '{kindle,digital}' where slug='herencia-con-maldicion';

-- Edición en hindi: enlace universal de Draft2Digital (Books2Read) con todas las tiendas
insert into sales_offers (book_id, platform, label, format, url, price, currency, delivery, active, sort)
select id, 'books2read', 'Apple Books, Kobo, Google Play y más', 'digital', 'https://books2read.com/u/475w5A', null, 'USD', 'digital', true, 0
from books where slug='the-secret-to-success-hindi'
  and not exists (select 1 from sales_offers o where o.book_id = books.id and o.platform='books2read');

-- ─── Ajustes del sitio ───
insert into settings (key, value) values
  ('hero_kicker_es','Autor · Investigador bíblico · Maestro'),
  ('hero_kicker_en','Author · Bible researcher · Teacher'),
  ('hero_kicker_hi','लेखक · बाइबल शोधकर्ता · शिक्षक'),
  ('hero_quote_es','Lo que heredamos no tiene por qué ser lo que dejamos. Cada generación puede elegir un nuevo comienzo.'),
  ('hero_quote_en','What we inherit does not have to be what we leave behind. Every generation can choose a new beginning.'),
  ('hero_quote_hi','जो हमें विरासत में मिला है, ज़रूरी नहीं कि वही हम पीछे छोड़ें। हर पीढ़ी एक नई शुरुआत चुन सकती है।'),
  ('hero_intro_es','Libros en español, inglés e hindi sobre restauración personal, familia y matrimonio, escritos desde más de 25 años enseñando principios bíblicos.'),
  ('hero_intro_en','Books in Spanish, English and Hindi on personal restoration, family and marriage, written from more than 25 years of teaching biblical principles.'),
  ('hero_intro_hi','व्यक्तिगत पुनर्स्थापना, परिवार और विवाह पर स्पेनिश, अंग्रेज़ी और हिन्दी में पुस्तकें — 25 से अधिक वर्षों के बाइबल शिक्षण के अनुभव से।'),
  ('author_bio_es', E'Mauricio Moraga Quezada es profesional de Relaciones Públicas de la Universidad Santo Tomás y estudioso de las Escrituras en sus lenguas originales. Se formó en Teología en el Instituto Bíblico Nacional, realizó estudios independientes de Griego Bíblico y estudió Hebreo Bíblico en el Rosen Institute, en Israel.\n\nDurante más de 25 años ha enseñado principios bíblicos en iglesias y grupos de estudio. Hoy reúne esa experiencia —formación, investigación y enseñanza— en libros que buscan ayudar a personas, familias y matrimonios a romper ciclos y construir un legado distinto.'),
  ('author_bio_en', E'Mauricio Moraga Quezada holds a degree in Public Relations from Universidad Santo Tomás and studies the Scriptures in their original languages. He trained in Theology at the Instituto Bíblico Nacional, pursued independent studies in Biblical Greek and studied Biblical Hebrew at the Rosen Institute in Israel.\n\nFor more than 25 years he has taught biblical principles in churches and study groups. Today he brings that experience — training, research and teaching — into books that help individuals, families and couples break cycles and build a different legacy.'),
  ('author_bio_hi', E'मौरिसियो मोरागा केसादा ने यूनिवर्सिदाद सांतो तोमास से जनसंपर्क (पब्लिक रिलेशंस) की पढ़ाई की है। उन्होंने इंस्टीट्यूटो बिब्लिको नासियोनाल में धर्मशास्त्र, स्वतंत्र रूप से बाइबिल यूनानी, और इज़राइल के रोज़ेन इंस्टीट्यूट में बाइबिल हिब्रू का अध्ययन किया है।\n\n25 से अधिक वर्षों से वे चर्चों और अध्ययन समूहों में बाइबल के सिद्धांत सिखा रहे हैं, और अब यह अनुभव ऐसी पुस्तकों में ला रहे हैं जो व्यक्तियों, परिवारों और दंपतियों को पुराने चक्र तोड़ने में मदद करती हैं।'),
  ('author_photo_url',''),
  ('contact_email',''),
  ('whatsapp_number',''),
  ('whatsapp_message','Hola Mauricio, quiero información sobre tus libros.'),
  ('facebook_url',''),
  ('instagram_url',''),
  ('youtube_url',''),
  ('tiktok_url',''),
  ('amazon_author_url',''),
  ('shipping_cost_CLP','0'),
  ('shipping_cost_USD','0'),
  ('shipping_note_es','Despacho a todo Chile. El costo se confirma por correo si corresponde.'),
  ('ga_id',''),
  ('meta_pixel_id',''),
  ('admin_notification_email','')
on conflict (key) do nothing;

insert into posts (slug, title, excerpt, body, published, cover_url, book_id) values
('bienvenidos-al-sitio-oficial','Bienvenidos al sitio oficial de Mauricio Moraga',
 'Todos los libros en un solo lugar: ediciones en español, inglés e hindi, con compra directa o en Amazon y Hotmart.',
 E'Este es el nuevo hogar de mis publicaciones. Aquí encontrarás cada libro con su idioma, formato y las plataformas donde puedes adquirirlo.\n\nSuscríbete para recibir los próximos lanzamientos y ediciones en nuevos idiomas.',
 true, '/covers/el-secreto-del-exito.jpg', (select id from books where slug='el-secreto-del-exito'))
on conflict (slug) do nothing;
