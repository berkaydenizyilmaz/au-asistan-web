export interface AnnouncementUnit {
  key: string;
  name: string;
  url: string;
  type: "main" | "unit";
}

export const ANNOUNCEMENT_UNITS: AnnouncementUnit[] = [
  {
    key: "genel",
    name: "Genel",
    url: "https://www.amasya.edu.tr/duyurular",
    type: "main",
  },
  {
    key: "muhendislik",
    name: "Mühendislik Fakültesi",
    url: "https://muhendislik.amasya.edu.tr/",
    type: "unit",
  },
  {
    key: "egitim",
    name: "Eğitim Fakültesi",
    url: "https://egitim.amasya.edu.tr/",
    type: "unit",
  },
  {
    key: "fenedebiyat",
    name: "Fen Edebiyat Fakültesi",
    url: "https://fenedebiyat.amasya.edu.tr/",
    type: "unit",
  },
  {
    key: "ilahiyat",
    name: "İlahiyat Fakültesi",
    url: "https://ilahiyat.amasya.edu.tr/",
    type: "unit",
  },
  {
    key: "oidb",
    name: "Öğrenci İşleri Daire Başkanlığı",
    url: "https://oidb.amasya.edu.tr/",
    type: "unit",
  },
];
