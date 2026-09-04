/** 維護腳本：由外部知識庫 Markdown 擷取 FAQ，更新各產品的 product-data.js。 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const kbRoot = path.join(root, "綜合知識庫v2");

const productKnowledge = {
  AceSpotDrill: "ACE_Spot_Drill_AI知識.md",
  ChamferMill: "Chamfer_Mill_AI_Knowledge.md",
  CornerRoundingR: "Corner_Rounding_AI_Knowledge.md",
  CornerRoundingRC: "Corner_Rounding_AI_Knowledge.md",
  ErgoER: "ERgo_AI_產品知識與FAQ.md",
  ICenter: "i-Center_AI_Knowledge.md",
  MCCDeburring: "MCC_Mill_AI知識庫.md",
  MCCThreadMill: "MCC_Mill_AI知識庫.md",
  MicroSpotDrill: "Micro_Spot_Drill_AI_Knowledge.md",
  N9MTW: "Engraving_Tool_AI_Knowledge.md",
  NCDeburring: "NC_Deburring_AI知識.md",
  NCHelixDrill: "NC_Helix_Drill_AI_知識庫.md",
  NCSpotDrill: "NC_Spot_Drill_AI知識.md",
  NineBore: "AI_搪刀產品知識庫.md",
  NineSwissBoring: "AI_搪刀產品知識庫.md",
  PowerMill: "Power_Mill_AI_Knowledge.md",
  SuperDrill: "Super_Drill_FAQ_Knowledge.md",
  SuperPowerDrill: "Super_Power_Drill_AI_Knowledge.md",
  V060: "Engraving_Tool_AI_Knowledge.md",
  W060: "Engraving_Tool_AI_Knowledge.md",
  X060: "Engraving_Tool_AI_Knowledge.md"
};

const fallbackFaqs = [
  {
    topic: "Knowledge status",
    question: "Is there a dedicated AI knowledge-base FAQ for this product?",
    answer:
      "No dedicated FAQ source was found in 綜合知識庫v2 for this product folder. Keep this page as a structured FAQ placeholder until product-specific cases, application notes, and cutting data are added."
  },
  {
    topic: "Application",
    question: "What information should be confirmed before recommending this product?",
    answer:
      "Confirm machine type, work material, hardness, operation type, tool holder, cutting depth, target tolerance, coolant condition, spindle speed, feed, and the customer's current issue before giving a technical recommendation."
  },
  {
    topic: "Support",
    question: "When should the case be escalated to Nine9 technical support?",
    answer:
      "Escalate when the customer asks for guaranteed tolerance, special tool design, unusual failure analysis, unsupported materials, or a process that depends on drawings, STEP data, or machine-specific G-code."
  }
];

function readText(file) {
  return fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
}

function cleanText(value) {
  return value
    .replace(/\r/g, "")
    .replace(/```[a-z]*\n?/gi, "")
    .replace(/```/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractFaqs(fileName) {
  const file = path.join(kbRoot, fileName);
  const markdown = readText(file);
  const lines = markdown.split(/\n/);
  const faqs = [];
  let inFaq = false;
  let current = null;

  const pushCurrent = () => {
    if (!current) return;
    current.answer = cleanText(current.answer);
    if (current.question && current.answer) faqs.push(current);
    current = null;
  };

  for (const line of lines) {
    if (/^##\s+/.test(line)) {
      if (inFaq && !/FAQ/i.test(line)) {
        pushCurrent();
        break;
      }
      if (/FAQ/i.test(line)) {
        inFaq = true;
        pushCurrent();
      }
      continue;
    }

    if (!inFaq) continue;

    const questionMatch = line.match(/^###\s*(?:Q\d+[.\s、．:：]*)?(.*)$/i);
    if (questionMatch) {
      pushCurrent();
      const question = questionMatch[1].trim();
      current = {
        topic: "Technical FAQ",
        question: question || "Technical question",
        answer: ""
      };
      continue;
    }

    if (current) {
      current.answer += `${line}\n`;
    }
  }

  pushCurrent();
  return faqs.length ? faqs : fallbackFaqs;
}

function readProductName(file) {
  const source = readText(file);
  const match = source.match(/productName:\s*"([^"]+)"/);
  return match ? match[1] : path.basename(path.dirname(file));
}

function productSummary(productName) {
  return `${productName} technical support area for catalog downloads, cutting data, NC programming support, and knowledge-base FAQ.`;
}

function writeProductData(productDir) {
  const productDataFile = path.join(root, "Products", productDir, "product-data.js");
  const productName = readProductName(productDataFile);
  const kbFile = productKnowledge[productDir];
  const faqs = kbFile ? extractFaqs(kbFile) : fallbackFaqs;

  const data = {
    productName,
    downloads: [
      { title: "Catalog", image: "", href: "" },
      { title: "Cutting Data", image: "", href: "" }
    ],
    programming: {
      title: "NC Program Generator",
      desc: productSummary(productName),
      href: ""
    },
    faqs
  };

  const output = `const PRODUCT_PAGE_DATA = ${JSON.stringify(data, null, 2)};\n`;
  fs.writeFileSync(productDataFile, output, "utf8");
  return { productDir, productName, faqCount: faqs.length, kbFile: kbFile || "fallback" };
}

const productsRoot = path.join(root, "Products");
const results = fs.readdirSync(productsRoot, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .filter(entry => fs.existsSync(path.join(productsRoot, entry.name, "product-data.js")))
  .map(entry => writeProductData(entry.name));

console.table(results);
