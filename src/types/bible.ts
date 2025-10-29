export enum BookName {
  GENESIS = 'GENESIS',
  EXODUS = 'EXODUS',
  LEVITICUS = 'LEVITICUS',
  NUMBERS = 'NUMBERS',
  DEUTERONOMY = 'DEUTERONOMY',
  JOSHUA = 'JOSHUA',
  JUDGES = 'JUDGES',
  RUTH = 'RUTH',
  FIRST_SAMUEL = 'FIRST_SAMUEL',
  SECOND_SAMUEL = 'SECOND_SAMUEL',
  FIRST_KINGS = 'FIRST_KINGS',
  SECOND_KINGS = 'SECOND_KINGS',
  FIRST_CHRONICLES = 'FIRST_CHRONICLES',
  SECOND_CHRONICLES = 'SECOND_CHRONICLES',
  EZRA = 'EZRA',
  NEHEMIAH = 'NEHEMIAH',
  ESTHER = 'ESTHER',
  JOB = 'JOB',
  PSALMS = 'PSALMS',
  PROVERBS = 'PROVERBS',
  ECCLESIASTES = 'ECCLESIASTES',
  SONG_OF_SONGS = 'SONG_OF_SONGS',
  ISAIAH = 'ISAIAH',
  JEREMIAH = 'JEREMIAH',
  LAMENTATIONS = 'LAMENTATIONS',
  EZEKIEL = 'EZEKIEL',
  DANIEL = 'DANIEL',
  HOSEA = 'HOSEA',
  JOEL = 'JOEL',
  AMOS = 'AMOS',
  OBADIAH = 'OBADIAH',
  JONAH = 'JONAH',
  MICAH = 'MICAH',
  NAHUM = 'NAHUM',
  HABAKKUK = 'HABAKKUK',
  ZEPHANIAH = 'ZEPHANIAH',
  HAGGAI = 'HAGGAI',
  ZECHARIAH = 'ZECHARIAH',
  MALACHI = 'MALACHI',
  MATTHEW = 'MATTHEW',
  MARK = 'MARK',
  LUKE = 'LUKE',
  JOHN = 'JOHN',
  ACTS = 'ACTS',
  ROMANS = 'ROMANS',
  FIRST_CORINTHIANS = 'FIRST_CORINTHIANS',
  SECOND_CORINTHIANS = 'SECOND_CORINTHIANS',
  GALATIANS = 'GALATIANS',
  EPHESIANS = 'EPHESIANS',
  PHILIPPIANS = 'PHILIPPIANS',
  COLOSSIANS = 'COLOSSIANS',
  FIRST_THESSALONIANS = 'FIRST_THESSALONIANS',
  SECOND_THESSALONIANS = 'SECOND_THESSALONIANS',
  FIRST_TIMOTHY = 'FIRST_TIMOTHY',
  SECOND_TIMOTHY = 'SECOND_TIMOTHY',
  TITUS = 'TITUS',
  PHILEMON = 'PHILEMON',
  HEBREWS = 'HEBREWS',
  JAMES = 'JAMES',
  FIRST_PETER = 'FIRST_PETER',
  SECOND_PETER = 'SECOND_PETER',
  FIRST_JOHN = 'FIRST_JOHN',
  SECOND_JOHN = 'SECOND_JOHN',
  THIRD_JOHN = 'THIRD_JOHN',
  JUDE = 'JUDE',
  REVELATION = 'REVELATION',
}

export interface BookInfo {
  displayName: string;
  order: number;
  chapters: number;
}

export const BOOK_INFO: Record<BookName, BookInfo> = {
  [BookName.GENESIS]: { displayName: '창세기', order: 1, chapters: 50 },
  [BookName.EXODUS]: { displayName: '출애굽기', order: 2, chapters: 40 },
  [BookName.LEVITICUS]: { displayName: '레위기', order: 3, chapters: 27 },
  [BookName.NUMBERS]: { displayName: '민수기', order: 4, chapters: 36 },
  [BookName.DEUTERONOMY]: { displayName: '신명기', order: 5, chapters: 34 },
  [BookName.JOSHUA]: { displayName: '여호수아', order: 6, chapters: 24 },
  [BookName.JUDGES]: { displayName: '사사기', order: 7, chapters: 21 },
  [BookName.RUTH]: { displayName: '룻기', order: 8, chapters: 4 },
  [BookName.FIRST_SAMUEL]: { displayName: '사무엘상', order: 9, chapters: 31 },
  [BookName.SECOND_SAMUEL]: { displayName: '사무엘하', order: 10, chapters: 24 },
  [BookName.FIRST_KINGS]: { displayName: '열왕기상', order: 11, chapters: 22 },
  [BookName.SECOND_KINGS]: { displayName: '열왕기하', order: 12, chapters: 25 },
  [BookName.FIRST_CHRONICLES]: { displayName: '역대상', order: 13, chapters: 29 },
  [BookName.SECOND_CHRONICLES]: { displayName: '역대하', order: 14, chapters: 36 },
  [BookName.EZRA]: { displayName: '에스라', order: 15, chapters: 10 },
  [BookName.NEHEMIAH]: { displayName: '느헤미야', order: 16, chapters: 13 },
  [BookName.ESTHER]: { displayName: '에스더', order: 17, chapters: 10 },
  [BookName.JOB]: { displayName: '욥기', order: 18, chapters: 42 },
  [BookName.PSALMS]: { displayName: '시편', order: 19, chapters: 150 },
  [BookName.PROVERBS]: { displayName: '잠언', order: 20, chapters: 31 },
  [BookName.ECCLESIASTES]: { displayName: '전도서', order: 21, chapters: 12 },
  [BookName.SONG_OF_SONGS]: { displayName: '아가', order: 22, chapters: 8 },
  [BookName.ISAIAH]: { displayName: '이사야', order: 23, chapters: 66 },
  [BookName.JEREMIAH]: { displayName: '예레미야', order: 24, chapters: 52 },
  [BookName.LAMENTATIONS]: { displayName: '예레미야애가', order: 25, chapters: 5 },
  [BookName.EZEKIEL]: { displayName: '에스겔', order: 26, chapters: 48 },
  [BookName.DANIEL]: { displayName: '다니엘', order: 27, chapters: 12 },
  [BookName.HOSEA]: { displayName: '호세아', order: 28, chapters: 14 },
  [BookName.JOEL]: { displayName: '요엘', order: 29, chapters: 3 },
  [BookName.AMOS]: { displayName: '아모스', order: 30, chapters: 9 },
  [BookName.OBADIAH]: { displayName: '오바댜', order: 31, chapters: 1 },
  [BookName.JONAH]: { displayName: '요나', order: 32, chapters: 4 },
  [BookName.MICAH]: { displayName: '미가', order: 33, chapters: 7 },
  [BookName.NAHUM]: { displayName: '나훔', order: 34, chapters: 3 },
  [BookName.HABAKKUK]: { displayName: '하박국', order: 35, chapters: 3 },
  [BookName.ZEPHANIAH]: { displayName: '스바냐', order: 36, chapters: 3 },
  [BookName.HAGGAI]: { displayName: '학개', order: 37, chapters: 2 },
  [BookName.ZECHARIAH]: { displayName: '스가랴', order: 38, chapters: 14 },
  [BookName.MALACHI]: { displayName: '말라기', order: 39, chapters: 4 },
  [BookName.MATTHEW]: { displayName: '마태복음', order: 40, chapters: 28 },
  [BookName.MARK]: { displayName: '마가복음', order: 41, chapters: 16 },
  [BookName.LUKE]: { displayName: '누가복음', order: 42, chapters: 24 },
  [BookName.JOHN]: { displayName: '요한복음', order: 43, chapters: 21 },
  [BookName.ACTS]: { displayName: '사도행전', order: 44, chapters: 28 },
  [BookName.ROMANS]: { displayName: '로마서', order: 45, chapters: 16 },
  [BookName.FIRST_CORINTHIANS]: { displayName: '고린도전서', order: 46, chapters: 16 },
  [BookName.SECOND_CORINTHIANS]: { displayName: '고린도후서', order: 47, chapters: 13 },
  [BookName.GALATIANS]: { displayName: '갈라디아서', order: 48, chapters: 6 },
  [BookName.EPHESIANS]: { displayName: '에베소서', order: 49, chapters: 6 },
  [BookName.PHILIPPIANS]: { displayName: '빌립보서', order: 50, chapters: 4 },
  [BookName.COLOSSIANS]: { displayName: '골로새서', order: 51, chapters: 4 },
  [BookName.FIRST_THESSALONIANS]: { displayName: '데살로니가전서', order: 52, chapters: 5 },
  [BookName.SECOND_THESSALONIANS]: { displayName: '데살로니가후서', order: 53, chapters: 3 },
  [BookName.FIRST_TIMOTHY]: { displayName: '디모데전서', order: 54, chapters: 6 },
  [BookName.SECOND_TIMOTHY]: { displayName: '디모데후서', order: 55, chapters: 4 },
  [BookName.TITUS]: { displayName: '디도서', order: 56, chapters: 3 },
  [BookName.PHILEMON]: { displayName: '빌레몬서', order: 57, chapters: 1 },
  [BookName.HEBREWS]: { displayName: '히브리서', order: 58, chapters: 13 },
  [BookName.JAMES]: { displayName: '야고보서', order: 59, chapters: 5 },
  [BookName.FIRST_PETER]: { displayName: '베드로전서', order: 60, chapters: 5 },
  [BookName.SECOND_PETER]: { displayName: '베드로후서', order: 61, chapters: 3 },
  [BookName.FIRST_JOHN]: { displayName: '요한일서', order: 62, chapters: 5 },
  [BookName.SECOND_JOHN]: { displayName: '요한이서', order: 63, chapters: 1 },
  [BookName.THIRD_JOHN]: { displayName: '요한삼서', order: 64, chapters: 1 },
  [BookName.JUDE]: { displayName: '유다서', order: 65, chapters: 1 },
  [BookName.REVELATION]: { displayName: '요한계시록', order: 66, chapters: 22 },
};

export interface VerseItem {
  verse_id: number;
  verse_number: number;
  content: string;
  is_mission: boolean;
  is_copied: boolean;
}

export interface ChapterResponse {
  verses: VerseItem[];
}

export interface RecentChapterResponse {
  book: BookName;
  chapter: number;
}

export interface BookListItem {
  book_code: string;
  book_name: string;
  order: number;
  is_mission: boolean;
}

export interface BookListResponse {
  books: BookListItem[];
}

export interface ChapterListResponse {
  chapters: number;
  mission_chapters: number[];
}
