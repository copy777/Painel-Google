import { useState, useMemo } from 'react';
import { Search, MapPin, Phone, Globe, MessageCircle } from 'lucide-react';
import leadsData from './data.json';
import './App.css';

function LeadCard({ lead }) {
  const whatsappLink = `https://wa.me/${lead.cleanPhone.replace(/\D/g, '')}?text=Olá,%20somos%20uma%20agência%20digital%20e%20percebemos%20que%20o%20${lead.name}%20não%20possui%20site.`;
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.fullAddress + ', ' + lead.city)}`;

  return (
    <div className="lead-card">
      <div className="card-header">
        <div>
          <span className="category-tag">{lead.category}</span>
          <h3 className="card-title">{lead.name}</h3>
        </div>
        <div className="no-website-badge">
          <Globe size={12} />
          <span>Sem Site</span>
        </div>
      </div>

      <div className="card-content">
        <div className="info-row">
          <Phone className="info-icon" size={16} />
          <span>{lead.phone}</span>
        </div>
        <div className="info-row">
          <MapPin className="info-icon" size={16} />
          <span>
            {lead.fullAddress} <br />
            <strong>{lead.city}</strong>
          </span>
        </div>
      </div>

      <div className="card-actions">
        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
          <MessageCircle size={18} />
          WhatsApp
        </a>
        <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="btn btn-maps">
          <MapPin size={18} />
          Google Maps
        </a>
      </div>
    </div>
  );
}

function App() {
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Extract unique cities and categories from data
  const cities = useMemo(() => {
    return [...new Set(leadsData.map(lead => lead.city))].sort();
  }, []);

  const categories = useMemo(() => {
    return [...new Set(leadsData.map(lead => lead.category))].sort();
  }, []);

  // Filter leads
  const filteredLeads = useMemo(() => {
    return leadsData.filter(lead => {
      const matchCity = selectedCity ? lead.city === selectedCity : true;
      const matchCategory = selectedCategory ? lead.category === selectedCategory : true;
      // Also strictly check no website
      const matchNoWebsite = !lead.website || lead.website === "";
      return matchCity && matchCategory && matchNoWebsite;
    });
  }, [selectedCity, selectedCategory]);

  return (
    <div className="dashboard-container">
      <header className="header">
        <div>
          <h1>Painel de Oportunidades</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Estabelecimentos em Mato Grosso, Goiás e Santa Catarina sem presença digital
          </p>
        </div>
        <div style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Search size={20} />
          <span>{filteredLeads.length} leads encontrados</span>
        </div>
      </header>

      <div className="filters-bar">
        <div className="filter-group">
          <label htmlFor="city">Cidade Local</label>
          <select 
            id="city" 
            value={selectedCity} 
            onChange={(e) => setSelectedCity(e.target.value)}
          >
            <option value="">Todas as Cidades</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="category">Categoria do Local</label>
          <select 
            id="category" 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Todas as Categorias</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredLeads.length > 0 ? (
        <div className="leads-grid">
          {filteredLeads.map(lead => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      ) : (
        <div className="no-results">
          <Search size={48} style={{ opacity: 0.2, margin: '0 auto 1rem auto', display: 'block' }} />
          <h3>Nenhum lead encontrado</h3>
          <p>Tente limpar os filtros para ver mais resultados.</p>
        </div>
      )}
    </div>
  );
}

export default App;
