import { ApifyClient } from 'apify-client';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

dotenv.config();

const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });

// ========================================================
//  CONFIGURAÇÃO DE BUSCA - cidades e categorias
// ========================================================
const SEARCHES = [
  // Restaurantes
  "restaurantes em São Paulo SP",
  "restaurantes em Rio de Janeiro RJ",
  "restaurantes em Belo Horizonte MG",
  "restaurantes em Curitiba PR",
  "restaurantes em Campinas SP",
  "restaurantes em Fortaleza CE",
  "restaurantes em Recife PE",
  "restaurantes em Salvador BA",
  "restaurantes em Manaus AM",
  "restaurantes em Goiânia GO",

  // Comércios locais
  "padarias em São Paulo SP",
  "padarias em Curitiba PR",
  "barbearias em São Paulo SP",
  "barbearias em Rio de Janeiro RJ",
  "salão de beleza em Campinas SP",
  "salão de beleza em Fortaleza CE",
  "oficinas mecânicas em Belo Horizonte MG",
  "oficinas mecânicas em Rio de Janeiro RJ",
  "farmácias em Goiânia GO",
  "supermercados em Manaus AM",
  "lojas de roupa em Salvador BA",
  "dentistas em Curitiba PR",
  "dentistas em Recife PE",
  "academias em São Paulo SP",
  "academias em Belo Horizonte MG",
];

const MAX_PER_SEARCH = 30; // Quantidade de lugares por busca

// ========================================================

function cleanAndFormatPhone(phone) {
  if (!phone) return null;
  let clean = phone.replace(/[\s\-\(\)\.]/g, '');
  if (clean.startsWith('0')) clean = clean.substring(1);
  if (!clean.startsWith('+55') && clean.length >= 10) {
    clean = '+55' + clean;
  }
  return clean;
}

function makeId(str) {
  return Buffer.from(str || Math.random().toString()).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 12);
}

async function loadExistingLeads(jsonPath) {
  try {
    const raw = await fs.readFile(jsonPath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function scrapeSearch(searchTerm) {
  console.log(`\n🔍 Buscando: "${searchTerm}"...`);
  try {
    const run = await client.actor("compass/crawler-google-places").call({
      searchStringsArray: [searchTerm],
      maxCrawledPlacesPerSearch: MAX_PER_SEARCH,
      language: "pt-BR",
      region: "BR",
    });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    const filtered = items.filter(place => {
      const noWebsite = !place.website || place.website.trim() === "";
      const hasPhone = place.phoneUnformatted || place.phone;
      return noWebsite && hasPhone;
    });

    console.log(`   📊 ${items.length} encontrados → ${filtered.length} SEM SITE ✅`);

    return filtered.map(place => {
      const rawPhone = place.phone || place.phoneUnformatted || "";
      const cleanPhone = cleanAndFormatPhone(rawPhone);
      return {
        id: makeId(place.placeId || place.url),
        name: place.title || "Estabelecimento",
        category: place.categoryName || "Comércio Local",
        city: place.city || place.neighborhood || place.state || "Não informado",
        phone: rawPhone,
        cleanPhone: cleanPhone,
        fullAddress: place.address || "Endereço não disponível",
        website: "",
        searchTerm,
      };
    });
  } catch (err) {
    console.error(`   ❌ Erro na busca "${searchTerm}": ${err.message}`);
    return [];
  }
}

async function saveAndPush(leads, jsonPath) {
  await fs.writeFile(jsonPath, JSON.stringify(leads, null, 2), 'utf-8');
  console.log(`\n💾 data.json atualizado com ${leads.length} leads no total.`);

  try {
    execSync('git add src/data.json', { cwd: process.cwd(), stdio: 'pipe' });
    execSync(`git commit -m "data: ${leads.length} leads reais sem site via Apify"`, { cwd: process.cwd(), stdio: 'pipe' });
    execSync('git push origin master', { cwd: process.cwd(), stdio: 'pipe' });
    console.log(`🚀 GitHub atualizado com ${leads.length} leads!`);
  } catch (err) {
    // Se não houver mudança, o commit falha, mas tudo bem
    if (!err.message.includes('nothing to commit')) {
      console.log(`⚠️  Git push: ${err.message}`);
    }
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("🚀 SCRAPER APIFY - LEADS REAIS SEM SITE");
  console.log(`📋 ${SEARCHES.length} buscas programadas | ${MAX_PER_SEARCH} lugares por busca`);
  console.log("=".repeat(60));

  const jsonPath = path.join(process.cwd(), 'src', 'data.json');

  // Carrega leads ja existentes para não perder dados anteriores
  let leads = await loadExistingLeads(jsonPath);
  const existingIds = new Set(leads.map(l => l.id));
  console.log(`\n📂 ${leads.length} leads já existentes carregados.`);

  let novosTotal = 0;

  for (const term of SEARCHES) {
    const novosLeads = await scrapeSearch(term);

    // Adiciona somente leads novos (sem duplicar por id)
    for (const lead of novosLeads) {
      if (!existingIds.has(lead.id)) {
        leads.push(lead);
        existingIds.add(lead.id);
        novosTotal++;
      }
    }

    // Salva e envia pro GitHub depois de CADA busca
    await saveAndPush(leads, jsonPath);
  }

  console.log("\n" + "=".repeat(60));
  console.log(`✨ CONCLUÍDO! ${novosTotal} novos leads adicionados.`);
  console.log(`📊 Total geral: ${leads.length} leads no painel.`);
  console.log("=".repeat(60));
}

main();
