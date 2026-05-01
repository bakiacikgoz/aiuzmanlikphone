export type AcademyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type PlacementResult = {
  level: AcademyLevel;
  label: string;
  scorePercent: number;
  recommendedPathSlug: string;
  estimatedHours: number;
};

export type PerceptronInput = {
  x1: number;
  x2: number;
  w1: number;
  w2: number;
  bias: number;
};

export type PerceptronOutput = {
  z: number;
  output: 0 | 1;
};

export type AnsweredQuestion = {
  answerIndex?: number;
};

export type LessonFlowItem = {
  slug: string;
  title: string;
  courseSlug?: string;
};

export type LessonContentSourceBlock = {
  id?: string;
  type: 'callout' | 'markdown' | 'code' | 'lab_embed' | string;
  title?: string;
  body?: string;
  codeLanguage?: string;
  code?: string;
  data?: Record<string, unknown>;
  sortOrder?: number;
};

export type LessonLearningStep = {
  id: string;
  kind: 'goal' | 'concept' | 'why' | 'practice' | 'code' | 'lab' | 'summary';
  title: string;
  body: string;
  bullets?: string[];
  orderedItems?: string[];
  codeLanguage?: string;
  code?: string;
  labSlug?: string;
  actionLabel?: string;
};

export type LessonQuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
};

export type LessonQuiz = {
  id: string;
  lessonSlug: string;
  title: string;
  passingScore: number;
  questions: LessonQuizQuestion[];
};

export type LessonQuizResult = {
  lessonSlug: string;
  questionCount: number;
  correctCount: number;
  scorePercent: number;
  passed: boolean;
  submittedAt: string;
};

export type LessonFlowState = {
  completedLessonSlugs: string[];
  stepProgressByLessonSlug: Record<string, number>;
  quizResultsByLessonSlug: Record<string, LessonQuizResult>;
};

export type LessonFlowTarget =
  | {
      kind: 'lab';
      label: string;
      description: string;
      labSlug: string;
    }
  | {
      kind: 'next_lesson';
      label: string;
      description: string;
      nextLessonSlug: string;
    }
  | {
      kind: 'course_complete';
      label: string;
      description: string;
      courseSlug?: string;
    };

const placementBands: {
  minPercent: number;
  result: Omit<PlacementResult, 'scorePercent'>;
}[] = [
  {
    minPercent: 85,
    result: {
      level: 'advanced',
      label: 'Ileri',
      recommendedPathSlug: 'ileri-ai-engineering',
      estimatedHours: 12,
    },
  },
  {
    minPercent: 60,
    result: {
      level: 'intermediate',
      label: 'Orta',
      recommendedPathSlug: 'orta-ai-engineering',
      estimatedHours: 10,
    },
  },
  {
    minPercent: 30,
    result: {
      level: 'beginner',
      label: 'Baslangic',
      recommendedPathSlug: 'baslangic-ai-engineering',
      estimatedHours: 6,
    },
  },
  {
    minPercent: 0,
    result: {
      level: 'beginner',
      label: 'Baslangic',
      recommendedPathSlug: 'baslangic-ai-engineering',
      estimatedHours: 6,
    },
  },
];

export function calculatePlacementResult(correctCount: number, questionCount: number): PlacementResult {
  const safeQuestionCount = Math.max(1, questionCount);
  const scorePercent = Math.round((Math.max(0, correctCount) / safeQuestionCount) * 100);
  const band = placementBands.find((item) => scorePercent >= item.minPercent) ?? placementBands.at(-1);

  return {
    ...band!.result,
    scorePercent,
  };
}

export function getPlacementStepLabel(currentIndex: number, totalQuestions: number): string {
  const safeTotal = Math.max(1, totalQuestions);
  const safeIndex = Math.min(Math.max(0, currentIndex), safeTotal - 1);
  return `Soru ${safeIndex + 1} / ${safeTotal}`;
}

export function isLastPlacementQuestion(currentIndex: number, totalQuestions: number): boolean {
  return currentIndex >= Math.max(1, totalQuestions) - 1;
}

export function countCorrectPlacementAnswers(
  questions: AnsweredQuestion[],
  selectedAnswers: Record<number, number | undefined>,
): number {
  return questions.reduce((total, question, index) => {
    if (typeof question.answerIndex !== 'number') return total;
    return selectedAnswers[index] === question.answerIndex ? total + 1 : total;
  }, 0);
}

export function getQuizResultMessage(result: { isCorrect?: boolean; explanation?: string | null }): string {
  if (result.isCorrect) return 'Dogru cevap. XP eklendi.';
  return result.explanation || 'Cevap tekrar incelenmeli.';
}

export function formatLabResultMessage(result: { status?: string; output?: number; z?: number }): string {
  const status = result.status ?? 'passed';
  const output = typeof result.output === 'number' ? result.output : '-';
  const z = typeof result.z === 'number' ? result.z.toFixed(2) : '-';
  return `Lab sonucu: ${status}. Cikti ${output}, z = ${z}.`;
}

export function runPerceptronLab(input: PerceptronInput): PerceptronOutput {
  const z = input.x1 * input.w1 + input.x2 * input.w2 + input.bias;

  return {
    z,
    output: z >= 0 ? 1 : 0,
  };
}

export function calculateProgressPercent(completed: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round((completed / total) * 100)));
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} dk`;
  }

  const hours = minutes / 60;
  return `~ ${Number.isInteger(hours) ? hours : hours.toFixed(1)} Saat`;
}

export function getNextCourseLesson<T extends LessonFlowItem>(lessons: T[], currentSlug: string | undefined): T | undefined {
  const currentLesson = lessons.find((lesson) => lesson.slug === currentSlug);
  if (!currentLesson?.courseSlug) {
    return undefined;
  }

  const courseLessons = lessons.filter((lesson) => lesson.courseSlug === currentLesson.courseSlug);
  return getNextLessonInSequence(courseLessons, currentLesson.slug);
}

export function getNextLessonInSequence<T extends { slug: string }>(lessons: T[], currentSlug: string | undefined): T | undefined {
  const currentIndex = lessons.findIndex((lesson) => lesson.slug === currentSlug);
  if (currentIndex < 0) {
    return undefined;
  }

  return lessons[currentIndex + 1];
}

export function createEmptyLessonFlowState(): LessonFlowState {
  return {
    completedLessonSlugs: [],
    stepProgressByLessonSlug: {},
    quizResultsByLessonSlug: {},
  };
}

function cleanMarkdownLine(line: string): string {
  return line.replace(/\*\*/g, '').replace(/^#+\s*/, '').trim();
}

function getMarkdownSection(body: string, heading: string): string[] {
  const lines = body.split('\n');
  const startIndex = lines.findIndex((line) => cleanMarkdownLine(line).toLocaleLowerCase('tr-TR') === heading.toLocaleLowerCase('tr-TR'));
  if (startIndex < 0) return [];
  const section: string[] = [];
  for (const line of lines.slice(startIndex + 1)) {
    if (line.trim().startsWith('##') || line.trim().startsWith('###')) break;
    section.push(line);
  }
  return section;
}

function extractBullets(lines: string[], fallback: string[]): string[] {
  const bullets = lines
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => cleanMarkdownLine(line.replace(/^-\s+/, '')));

  return bullets.length ? bullets : fallback;
}

function extractOrderedItems(lines: string[], fallback: string[]): string[] {
  const items = lines
    .map((line) => line.trim())
    .filter((line) => /^\d+\.\s+/.test(line))
    .map((line) => cleanMarkdownLine(line.replace(/^\d+\.\s+/, '')));

  return items.length ? items : fallback;
}

function normalizeSubject(title: string): string {
  return title.trim() || 'bu konu';
}

type LessonTeachingProfile = {
  goalBody: string;
  goalBullets: string[];
  conceptBody: string;
  conceptBullets: string[];
  whyBody: string;
  whyBullets: string[];
  practiceBody: string;
  practiceItems: string[];
  exampleBody: string;
  codeBullets: string[];
  summaryBody: string;
  summaryBullets: string[];
};

function mergeUniqueItems(primary: string[], secondary: string[], limit = 5): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const item of [...primary, ...secondary]) {
    const normalized = item.trim();
    const key = normalized.toLocaleLowerCase('tr-TR');
    if (!normalized || seen.has(key)) continue;
    seen.add(key);
    merged.push(normalized);
    if (merged.length >= limit) break;
  }
  return merged;
}

function createTeachingProfile(subject: string): LessonTeachingProfile {
  const key = subject.toLocaleLowerCase('tr-TR');

  if (key.includes('python') && key.includes('paket') && key.includes('notebook')) {
    return {
      goalBody: 'Bu derste Python kodunu çalıştıran ortamı, paket bağımlılıklarını ve notebook çalışma düzenini birlikte ele alacaksın. Hedef, sadece kod yazmak değil; aynı çalışmayı yarın tekrar açtığında veya ekip arkadaşına gönderdiğinde aynı sonucu alabilecek bir akış kurmaktır.',
      goalBullets: [
        'Python ortamı, paket ve notebook arasındaki farkı ayırt et',
        'Bir notebook hücresinin gizli duruma bağlı kalmadan nasıl çalıştığını kontrol et',
        'Küçük bir metin temizleme örneğini tekrar üretilebilir hale getir',
      ],
      conceptBody: 'Python dilin kendisidir; paketler hazır araç kutularıdır; notebook ise deney yaptığın çalışma defteridir. AI projesinde notebook keşif ve deneme için güçlüdür, fakat hücreleri rastgele sırayla çalıştırırsan sonuç görünmeyen eski değişkenlere bağlı kalabilir. Bu yüzden iyi akış; temiz ortam, açık paket listesi, yukarıdan aşağı çalışan hücreler ve küçük doğrulama çıktıları demektir.',
      conceptBullets: [
        'Ortam: Python sürümü ve kurulu paketlerin birlikte oluşturduğu çalışma alanıdır',
        'Paket: NumPy, pandas veya scikit-learn gibi hazır fonksiyonları projeye ekler',
        'Notebook: deneme yapmak için uygundur; kalıcı ürün kodu için düzenli dosyalara taşınmalıdır',
      ],
      whyBody: 'AI projelerinde sonuçların güvenilir olması için aynı kodun aynı girdide aynı çıktıyı üretmesi gerekir. Paket sürümü değişirse, notebook hücre sırası bozulursa veya veri yolu belirsizse model hatası sanılan problem aslında çalışma ortamı problemidir.',
      whyBullets: [
        'Paket sürümü sabitlenmezse ekipte çalışan kod başka makinede bozulabilir',
        'Notebook hücreleri sırayla çalışmıyorsa gizli değişkenler yanlış sonucu saklayabilir',
        'Küçük doğrulama çıktıları hatayı model aşamasına gelmeden yakalatır',
      ],
      practiceBody: 'Bu akışı gerçek bir mini proje gibi uygula. Amaç, “benim bilgisayarımda çalışıyor” seviyesinden çıkıp tekrar edilebilir bir çalışma düzeni kurmaktır.',
      practiceItems: [
        'Temiz bir klasör aç ve kullanacağın Python sürümünü not et',
        'Kullanacağın paketi yüklemeden önce ne için gerektiğini yaz',
        'Notebook ilk hücresinde importları ve paket sürümlerini göster',
        'Bir örnek girdi belirle, çıktıyı tahmin et, sonra kodu çalıştır',
        'Çıktı beklediğin gibi değilse önce hücre sırası ve ortamı kontrol et',
      ],
      exampleBody: 'Kod örneğini bir metin temizleme pipelineının en küçük parçası gibi oku: girdi gelir, gereksiz boşluklar temizlenir, harfler standartlaşır ve modelleme öncesi daha tutarlı metin üretilir.',
      codeBullets: [
        'Fonksiyonun aldığı ham metni ve döndürdüğü temiz metni ayrı düşün',
        'lower, strip ve split adımlarının her birinin çıktıyı nasıl değiştirdiğini söyle',
        'Örneği farklı boşluk ve büyük harflerle değiştirip sonucu tahmin et',
      ],
      summaryBody: 'Bu dersi bitirdiğinde bir notebookun sadece “kod yazma ekranı” olmadığını; ortam, paket, hücre sırası ve doğrulama çıktılarıyla birlikte yönetilmesi gereken bir deney defteri olduğunu bilmelisin.',
      summaryBullets: [
        'Yeni bir notebooku yukarıdan aşağı çalışabilir kurabiliyor musun?',
        'Bir paket eklendiğinde neden ve nerede kullanıldığını açıklayabiliyor musun?',
        'Çıktı değiştiğinde önce ortamı mı, kodu mu, veriyi mi kontrol edeceğini biliyor musun?',
      ],
    };
  }

  if (key.includes('değişken') || key.includes('veri tipi') || key.includes('kontrol akışı')) {
    return {
      goalBody: 'Bu derste veriyi isimlendirmeyi, doğru tipte tutmayı ve koşullara göre farklı işlem yolları kurmayı öğreneceksin. AI uygulamalarında bu beceri, ham girdiyi modele vermeden önce güvenli biçimde hazırlamak için kullanılır.',
      goalBullets: ['Değişkeni geçici kutu değil, anlamlı veri adı olarak kullan', 'Tipin işlem davranışını nasıl değiştirdiğini gör', 'if/else akışıyla hatalı girdiyi erken ayır'],
      conceptBody: 'Değişken bir değere verdiğin isimdir; veri tipi o değerin nasıl davranacağını belirler; kontrol akışı ise programın hangi durumda hangi yolu izleyeceğini söyler. Örneğin kullanıcıdan gelen metin boşsa temizleme fonksiyonuna geçmeden durmak, sayı beklerken metin geldiyse uyarı üretmek bu konunun pratik karşılığıdır.',
      conceptBullets: ['str metin işlemleri için, int/float sayısal hesap için, bool karar için kullanılır', 'Tip dönüşümü bilinçli yapılmazsa sessiz veri kaybı oluşabilir', 'Koşullar hata yakalamak için ilk savunma hattıdır'],
      whyBody: 'Model kalitesi yalnızca algoritmadan gelmez; modele verdiğin girdinin doğru tipte, beklenen aralıkta ve anlamlı olması gerekir. Yanlış tip veya kontrolsüz akış, modelden önce uygulamayı kırar.',
      whyBullets: ['Boş metin, None veya yanlış sayı tipi model girişini bozabilir', 'Kontrol akışı hatalı veriyi erken durdurur', 'Anlamlı değişken adları daha sonra debug yapmayı kolaylaştırır'],
      practiceBody: 'Küçük bir kullanıcı girdisi doğrulama akışı kurduğunu düşün. Her adımda verinin ne olduğunu ve hangi şartta ilerleyeceğini açıkça yaz.',
      practiceItems: ['Girdi değişkenine anlamlı bir ad ver', 'Girdinin beklenen tipini yaz', 'Boş veya geçersiz değeri if ile yakala', 'Geçerli değeri dönüştür ve sonucu ekrana yaz', 'Yanlış giriş için açıklayıcı hata mesajı üret'],
      exampleBody: 'Kod okurken değişkenin ilk değerinden son çıktıya kadar nasıl değiştiğini izle. Her satırdan sonra değişkenin tipini ve değerini tahmin etmek öğrenmeyi hızlandırır.',
      codeBullets: ['Her değişkenin hangi tipte başladığını söyle', 'Koşulun hangi durumda True olacağını tahmin et', 'Çıktıyı çalıştırmadan önce kendin yaz'],
      summaryBody: 'Bu dersin ana fikri: doğru isim, doğru tip ve doğru karar akışı olmadan sağlam AI uygulaması kurulamaz.',
      summaryBullets: ['Bir girdinin tipini kontrol edebiliyor musun?', 'Geçersiz veriyi modelden önce durdurabiliyor musun?', 'Kodda hangi yolun çalışacağını açıklayabiliyor musun?'],
    };
  }

  if (key.includes('fonksiyon') || key.includes('modül') || key.includes('hata')) {
    return {
      goalBody: 'Bu derste tekrar eden kodu fonksiyona ayırmayı, fonksiyonları modüller içinde düzenlemeyi ve beklenen hataları kontrollü şekilde yönetmeyi öğreneceksin.',
      goalBullets: ['Tekrar eden adımı fonksiyon haline getir', 'Fonksiyonun girdi ve çıktısını net yaz', 'Hata durumunda programı sessizce bozmak yerine açıklayıcı sonuç üret'],
      conceptBody: 'Fonksiyon, belirli bir girdiyi alıp beklenen bir çıktıya dönüştüren küçük bir sözleşmedir. Modül, ilgili fonksiyonları aynı dosyada düzenler. Hata yönetimi ise bu sözleşme bozulduğunda ne yapılacağını açıklar.',
      conceptBullets: ['Fonksiyon tek bir iş yapmalıdır', 'Modül isimleri kullanım amacını anlatmalıdır', 'try/except yalnızca beklenen hatalar için kullanılmalıdır'],
      whyBody: 'AI projelerinde veri temizleme, özellik çıkarma ve metrik hesaplama adımları defalarca tekrar eder. Bu adımlar fonksiyonlaşmazsa test edilmesi, paylaşılması ve hatasının bulunması zorlaşır.',
      whyBullets: ['Fonksiyon küçükse test yazmak kolaylaşır', 'Modül düzeni ekip içinde ortak dil oluşturur', 'Açık hata mesajı yanlış veriyi hızlı buldurur'],
      practiceBody: 'Bir veri temizleme adımını ürün koduna taşıyormuş gibi ilerle. Önce fonksiyonun sözleşmesini yaz, sonra örnekle doğrula.',
      practiceItems: ['Fonksiyonun aldığı girdiyi ve döndürdüğü çıktıyı yaz', 'Normal durum için küçük örnek oluştur', 'Hatalı girdi için beklenen davranışı belirle', 'Fonksiyonu ilgili modüle taşı', 'Aynı örneği tekrar çalıştırıp sonucu doğrula'],
      exampleBody: 'Kod örneğinde fonksiyonun nerede başladığını, hangi değeri döndürdüğünü ve hangi durumda hata verebileceğini izle.',
      codeBullets: ['Parametreleri ve dönüş değerini ayır', 'Fonksiyon içinde yan etki olup olmadığını kontrol et', 'Hatalı girdi geldiğinde ne olacağını düşün'],
      summaryBody: 'Bu dersin ana fikri: iyi fonksiyon, küçük ve test edilebilir bir sözleşmedir; iyi modül bu sözleşmeleri düzenli tutar.',
      summaryBullets: ['Fonksiyonun tek işini söyleyebiliyor musun?', 'Hatalı girdide beklenen davranışı yazabiliyor musun?', 'Fonksiyonu başka dosyadan kullanabilecek şekilde düzenleyebiliyor musun?'],
    };
  }

  if (key.includes('json') || key.includes('csv') || key.includes('pipeline')) {
    return {
      goalBody: 'Bu derste dosyadan veri okumayı, veriyi küçük dönüşüm adımlarından geçirmeyi ve sonucu kontrol edilebilir bir pipeline olarak düşünmeyi öğreneceksin.',
      goalBullets: ['JSON ve CSV formatlarının farkını ayırt et', 'Okunan verinin satır, kolon ve anahtar yapısını kontrol et', 'Dönüşüm adımlarını ölçülebilir küçük parçalara böl'],
      conceptBody: 'CSV çoğunlukla tablo verisi için, JSON ise iç içe geçmiş kayıtlar için kullanılır. Pipeline, verinin ham halden kullanılabilir hale gelene kadar geçtiği adımların sıralı ve tekrar edilebilir biçimidir.',
      conceptBullets: ['Okuma adımı yalnızca dosyayı açmak değildir; şema kontrolü de gerekir', 'Her dönüşümden sonra satır sayısı veya örnek çıktı kontrol edilmelidir', 'Pipeline adımları aynı girdide aynı çıktıyı üretmelidir'],
      whyBody: 'AI modelinin kalitesi, pipelineın güvenilirliğine bağlıdır. Yanlış ayrılmış CSV, eksik JSON alanı veya kontrolsüz dönüşüm model hatası gibi görünebilir.',
      whyBullets: ['Şema bozulursa özellik çıkarımı bozulur', 'Ara kontrol yoksa hata en sonda fark edilir', 'Tekrar edilebilir pipeline deney karşılaştırmasını kolaylaştırır'],
      practiceBody: 'Küçük bir veri dosyasını ürün akışına alıyormuş gibi düşün. Önce oku, sonra yapıyı doğrula, sonra tek bir dönüşüm yap.',
      practiceItems: ['Dosyayı oku ve ilk iki kaydı incele', 'Beklenen kolon veya anahtarları kontrol et', 'Eksik alan varsa ne yapılacağını belirle', 'Tek dönüşüm uygula ve sonucu yazdır', 'Satır sayısı veya örnek çıktı ile doğrula'],
      exampleBody: 'Kod örneğini veri giriş kapısı olarak oku: dosya nereden geliyor, hangi yapıya dönüşüyor, hangi kontrol sonucu güven veriyor?',
      codeBullets: ['Dosya yolu ve format varsayımını kontrol et', 'Okunan verinin şeklini yazdır', 'Dönüşüm sonrası örnek çıktıyı karşılaştır'],
      summaryBody: 'Bu dersin ana fikri: veri okumak, dosyayı açmak değil; yapıyı doğrulayıp güvenilir dönüşüm akışı kurmaktır.',
      summaryBullets: ['Format farkını açıklayabiliyor musun?', 'Okuma sonrası ilk kontrolü biliyor musun?', 'Pipelineın hangi adımında hata olabileceğini bulabiliyor musun?'],
    };
  }

  return {
    goalBody: `${subject} konusunu bu derste bir tanım olarak değil, AI ürün akışında karar vermeni sağlayan pratik bir araç olarak öğreneceksin. Ders sonunda kavramı nerede kullanacağını, hangi girdiye ihtiyaç duyduğunu ve sonucu nasıl kontrol edeceğini açıklayabilmelisin.`,
    goalBullets: ['Kavramın ne işe yaradığını kendi cümlenle açıkla', 'Gerçek bir AI akışında hangi adımda kullanıldığını gör', 'Küçük bir örnekle sonucu kontrol et'],
    conceptBody: `${subject}, tek başına ezberlenecek bir başlık değildir. Bir girdiyi alır, belirli bir amaç için dönüştürür veya değerlendirir ve sonraki adıma daha güvenli geçmeni sağlar. Bu yüzden önce problemi, sonra girdiyi, sonra beklenen çıktıyı netleştirmek gerekir.`,
    conceptBullets: ['Önce problemi yaz: hangi belirsizliği azaltıyorsun?', 'Sonra girdiyi yaz: hangi veri veya değerle çalışıyorsun?', 'Son olarak çıktıyı yaz: doğru sonucu nasıl anlayacaksın?'],
    whyBody: `${subject} öğrenirken amaç, büyük sistemi tek seferde kurmak değil, hatayı erken görebileceğin küçük karar noktaları oluşturmaktır. Böylece yanlış varsayımı model, prompt veya arayüz aşamasına taşımadan önce yakalarsın.`,
    whyBullets: ['Küçük kontrol noktaları debug süresini azaltır', 'Beklenen çıktı yazılırsa başarı ölçütü netleşir', 'Aynı adımı tekrar çalıştırmak deney kalitesini artırır'],
    practiceBody: 'Bu konuyu uygularken her şeyi tek seferde çözmeye çalışma. Önce küçük bir örnek seç, sonucu tahmin et, sonra çalıştır ve farkı yorumla.',
    practiceItems: ['Bir örnek girdi seç', 'Beklenen çıktıyı çalıştırmadan önce yaz', 'En küçük uygulama adımını çalıştır', 'Çıktıyı beklenen sonuçla karşılaştır', 'Fark varsa varsayımını düzeltip tekrar dene'],
    exampleBody: 'Örneği okurken kodu veya işlemi satır satır kopyalamak yerine girdi, dönüşüm ve çıktı zincirini takip et.',
    codeBullets: ['Girdinin nerede tanımlandığını bul', 'Dönüşümün hangi satırda yapıldığını işaretle', 'Çıktıyı çalıştırmadan önce tahmin et'],
    summaryBody: `${subject} için ana kontrol şudur: kavramı yalnızca tanıyor musun, yoksa küçük bir örnekte doğru kullanıp sonucu doğrulayabiliyor musun?`,
    summaryBullets: ['Kavramı bir cümleyle açıklayabiliyor musun?', 'Küçük bir örnek kurabiliyor musun?', 'Sonucun doğru olduğunu nasıl anlayacağını biliyor musun?'],
  };
}

export function buildLessonLearningSteps(lesson: LessonFlowItem, blocks: LessonContentSourceBlock[]): LessonLearningStep[] {
  const subject = normalizeSubject(lesson.title);
  const profile = createTeachingProfile(subject);
  const sortedBlocks = blocks.slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const goalBlock = sortedBlocks.find((block) => block.type === 'callout');
  const markdownBlock = sortedBlocks.find((block) => block.type === 'markdown');
  const codeBlock = sortedBlocks.find((block) => block.type === 'code');
  const labBlock = sortedBlocks.find((block) => block.type === 'lab_embed');
  const markdownBody = markdownBlock?.body ?? '';
  const whyLines = getMarkdownSection(markdownBody, 'Neden önemli?');
  const practiceLines = getMarkdownSection(markdownBody, 'Uygulama kontrolü');
  const labSlug = typeof labBlock?.data?.lab_slug === 'string' ? labBlock.data.lab_slug : undefined;
  const steps: LessonLearningStep[] = [
    {
      id: `${lesson.slug}-goal`,
      kind: 'goal',
      title: goalBlock?.title || 'Öğrenme hedefi',
      body: profile.goalBody,
      bullets: profile.goalBullets,
    },
    {
      id: `${lesson.slug}-concept`,
      kind: 'concept',
      title: 'Kavramı gerçekten anlayalım',
      body: profile.conceptBody,
      bullets: profile.conceptBullets,
    },
    {
      id: `${lesson.slug}-why`,
      kind: 'why',
      title: 'Neden önemli?',
      body: profile.whyBody,
      bullets: mergeUniqueItems(profile.whyBullets, extractBullets(whyLines, [])),
    },
    {
      id: `${lesson.slug}-practice`,
      kind: 'practice',
      title: 'Adım adım uygulama',
      body: profile.practiceBody,
      orderedItems: mergeUniqueItems(profile.practiceItems, extractOrderedItems(practiceLines, [])),
    },
  ];

  if (codeBlock?.code) {
    steps.push({
      id: `${lesson.slug}-code`,
      kind: 'code',
      title: codeBlock.title || 'Kod üzerinden okuyalım',
      body: profile.exampleBody,
      codeLanguage: codeBlock.codeLanguage || 'python',
      code: codeBlock.code,
      bullets: profile.codeBullets,
    });
  } else {
    steps.push({
      id: `${lesson.slug}-mini-example`,
      kind: 'practice',
      title: 'Mini örnek düşüncesi',
      body: profile.exampleBody,
      orderedItems: ['Bir örnek girdi yaz', 'Beklenen çıktıyı çalıştırmadan önce tahmin et', 'Sonucu kontrol edecek tek bir koşul belirle'],
    });
  }

  if (labBlock) {
    steps.push({
      id: `${lesson.slug}-lab`,
      kind: 'lab',
      title: labBlock.title || 'Mini Lab',
      body: labBlock.body || 'Bu labı zorunlu geçiş kapısı olarak değil, öğrendiğin akışı küçük bir değişiklikle deneme alanı olarak kullan. Labdan sonra derse dönüp quiz ile anladığını doğrulayacaksın.',
      labSlug,
      actionLabel: "Mini Lab'a Git",
    });
  }

  steps.push({
    id: `${lesson.slug}-summary`,
    kind: 'summary',
    title: 'Quiz öncesi kısa tekrar',
    body: profile.summaryBody,
    bullets: profile.summaryBullets,
  });

  while (steps.length < 6) {
    const index = steps.length + 1;
    steps.splice(steps.length - 1, 0, {
      id: `${lesson.slug}-checkpoint-${index}`,
      kind: 'practice',
      title: `Kontrol noktası ${index}`,
      body: `${subject} için öğrendiğin bilgiyi kendi cümlenle ifade et ve küçük bir örnekle doğrula.`,
      bullets: ['Bir örnek seç', 'Beklenen sonucu yaz', 'Neden böyle olduğunu açıkla'],
    });
  }

  return steps;
}

export function buildLessonQuiz(lesson: LessonFlowItem, blocks: LessonContentSourceBlock[]): LessonQuiz {
  const subject = normalizeSubject(lesson.title);
  const hasCode = blocks.some((block) => block.type === 'code' && block.code);
  const hasLab = blocks.some((block) => block.type === 'lab_embed');

  return {
    id: `${lesson.slug}-quiz`,
    lessonSlug: lesson.slug,
    title: `${subject} Kontrol Quizi`,
    passingScore: 70,
    questions: [
      {
        id: `${lesson.slug}-quiz-1`,
        prompt: `${subject} dersinin ana amacı nedir?`,
        options: [
          'Konuyu gerçek bir AI projesinde ne zaman kullanacağını anlayıp uygulayabilmek',
          'Sadece başlığı ezberlemek',
          'Ölçüm yapmadan sonraki adıma geçmek',
          'Tüm hataları kullanıcıya bırakmak',
        ],
        answerIndex: 0,
        explanation: 'Dersin amacı kavramı ezberletmek değil, doğru bağlamda kullandırmaktır.',
      },
      {
        id: `${lesson.slug}-quiz-2`,
        prompt: `${subject} çalışırken ilk güvenli adım hangisidir?`,
        options: [
          'Rastgele büyük bir sistem kurmak',
          'Girdi, beklenen çıktı ve başarı ölçütünü netleştirmek',
          'Hataları görmezden gelmek',
          'Sonucu ölçmeden yayınlamak',
        ],
        answerIndex: 1,
        explanation: 'İyi tanımlanmış girdi, çıktı ve başarı ölçütü öğrenme ve geliştirme kalitesini artırır.',
      },
      {
        id: `${lesson.slug}-quiz-3`,
        prompt: 'Küçük çalışan örnek neden önemlidir?',
        options: [
          'Sadece ekranı doldurmak için kullanılır',
          'Model eğitimini her zaman gereksiz yapar',
          'Varsayımı hızlı test eder ve hatayı erken yakalatır',
          'Veri kalitesini kontrol etmeyi engeller',
        ],
        answerIndex: 2,
        explanation: 'Küçük örnek, karmaşık sisteme geçmeden önce varsayımı test etmeyi sağlar.',
      },
      {
        id: `${lesson.slug}-quiz-4`,
        prompt: hasCode ? 'Kod örneğini okurken en doğru yaklaşım hangisidir?' : 'Uygulama adımlarını izlerken en doğru yaklaşım hangisidir?',
        options: [
          'Sadece son satıra bakmak',
          'Kodun veya adımın çıktısını hiç tahmin etmemek',
          'Her şeyi tek seferde değiştirmek',
          'Girdiyi, dönüşümü ve çıktıyı sırayla takip etmek',
        ],
        answerIndex: 3,
        explanation: 'Kod veya uygulama adımı, girdi-dönüşüm-çıktı zinciriyle okunmalıdır.',
      },
      {
        id: `${lesson.slug}-quiz-5`,
        prompt: hasLab ? 'Mini lab yaptıktan sonra dersi tamamlamak için ne gerekir?' : 'Dersi tamamlamak için ne gerekir?',
        options: [
          'Quizde başarı eşiğini geçerek kavramı anladığını göstermek',
          'Lab veya örneği hiç kontrol etmemek',
          'Yanlış cevaptan sonra doğrudan geçmek',
          'Öğrenme hedefini okumadan çıkmak',
        ],
        answerIndex: 0,
        explanation: 'Sonraki ders kilidi quiz başarısıyla açılır; lab pekiştirme adımıdır.',
      },
    ],
  };
}

export function gradeLessonQuiz(quiz: LessonQuiz, selectedAnswers: Record<string, number | undefined>, submittedAt = new Date().toISOString()): LessonQuizResult {
  const correctCount = quiz.questions.reduce((total, question) => {
    return selectedAnswers[question.id] === question.answerIndex ? total + 1 : total;
  }, 0);
  const questionCount = quiz.questions.length;
  const scorePercent = questionCount ? Math.round((correctCount / questionCount) * 100) : 0;
  const requiredCorrect = Math.ceil((questionCount * quiz.passingScore) / 100);

  return {
    lessonSlug: quiz.lessonSlug,
    questionCount,
    correctCount,
    scorePercent,
    passed: correctCount >= requiredCorrect,
    submittedAt,
  };
}

export function isLessonUnlocked<T extends { slug: string }>(sequence: T[], lessonSlug: string | undefined, completedLessonSlugs: Set<string> | string[]): boolean {
  if (!lessonSlug) return false;
  const completed = completedLessonSlugs instanceof Set ? completedLessonSlugs : new Set(completedLessonSlugs);
  const index = sequence.findIndex((lesson) => lesson.slug === lessonSlug);
  if (index < 0) return false;
  if (index === 0) return true;
  if (completed.has(lessonSlug)) return true;
  return completed.has(sequence[index - 1].slug);
}

export function getLessonFlowTarget(input: {
  labSlug?: string;
  nextLesson?: LessonFlowItem;
  courseSlug?: string;
}): LessonFlowTarget {
  if (input.labSlug) {
    return {
      kind: 'lab',
      label: "Mini Lab'a Git",
      description: 'Bu dersin mini lab calismasiyla pekistir.',
      labSlug: input.labSlug,
    };
  }

  if (input.nextLesson) {
    return {
      kind: 'next_lesson',
      label: 'Sonraki Derse Gec',
      description: `Sonraki ders: ${input.nextLesson.title}`,
      nextLessonSlug: input.nextLesson.slug,
    };
  }

  return {
    kind: 'course_complete',
    label: 'Dersi Tamamla',
    description: 'Kurs dersleri tamamlandi.',
    courseSlug: input.courseSlug,
  };
}
