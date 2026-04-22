import { ApifyClient } from 'apify-client';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

// Carrega as variáveis do .env
dotenv.config();

// Inicializa o cliente da Apify
const client = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
});

async function runScraper() {
    console.log("🚀 Iniciando a raspagem do Google Maps pela Apify...");
    console.log("Isso pode demorar alguns minutos. Tenha paciência!");

    // Termos de busca (você pode alterar para o que quiser)
    const searchTerms = [
        "restaurantes em campinas"
        // Pode adicionar mais itens após a vírgula: "oficina mecanica no rio de janeiro"
    ];

    try {
        // Envia a chamada ao Actor compass/crawler-google-places
        const run = await client.actor("compass/crawler-google-places").call({
            searchStringsArray: searchTerms,
            maxCrawledPlacesPerSearch: 30, // Quantidade que o scraper vai visitar. Aumente se precisar!
            language: "pt-BR",
            region: "BR"
        });

        console.log(`✅ Extração concluída da Apify! Baixando amostra de resultados...`);

        // Busca os resultados salvos no Dataset da execução
        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        console.log(`🔍 Total de estabelecimentos na pesquisa crua: ${items.length}`);

        // Filtra para pegar SOMENTE quem NÃO tem site e POSSUI número de telefone
        const leadsSemSite = items.filter(place => {
            const hasNoWebsite = !place.website || place.website.trim() === "";
            const hasPhone = place.phoneUnformatted || place.phone;
            return hasNoWebsite && hasPhone;
        });

        console.log(`🎯 Sucesso! Encontrados ${leadsSemSite.length} estabelecimentos SEM SITE.`);

        // Padroniza e limpa para salvar bonitinho no data.json
        const formattedLeads = leadsSemSite.map((lead, index) => {
            // Se já vier desformatado (+55119999999), ótimo. Senão, limpamos espaços, traços e parênteses.
            let cleanPhone = lead.phoneUnformatted || lead.phone || "";
            cleanPhone = cleanPhone.replace(/[\s\-\(\)\.]/g, ''); 
            
            // Garantir que comece com o código do brasil (+55) se não vier
            if (cleanPhone.startsWith('0')) {
                cleanPhone = cleanPhone.substring(1);
            }
            if (!cleanPhone.includes('+55') && cleanPhone.length >= 10) {
                 cleanPhone = '+55' + cleanPhone;
            }

            return {
                id: Buffer.from(lead.placeId || lead.url || `apify_${index}`).toString('base64').substring(0, 10),
                name: lead.title || lead.title_pt_BR || lead.name || "Estabelecimento Desconhecido",
                category: lead.categoryName || "Comércio Local",
                city: lead.city || lead.neighborhood || lead.state || "Local não identificado",
                phone: lead.phone || lead.phoneUnformatted,
                cleanPhone: cleanPhone,
                fullAddress: lead.address || "Endereço não disponível",
                website: "" // Garantido que não tem
            };
        });

        // Caminho absoluto para o src/data.json
        const jsonPath = path.join(process.cwd(), 'src', 'data.json');
        
        // Sobrescrevemos o data.json com a glória dos dados reais!
        await fs.writeFile(jsonPath, JSON.stringify(formattedLeads, null, 2), 'utf-8');

        console.log(`✨ Arquivo src/data.json atualizado com ${formattedLeads.length} leads fofos!`);

    } catch (error) {
        console.error("❌ Ocorreu um erro durante a raspagem do Apify:");
        console.error(error.message);
        console.log("Verifique se o Actor 'compass/crawler-google-places' está livre para usar em sua conta ou se precisa chamar 'apify/google-maps-scraper'.");
    }
}

runScraper();
