import { useState, useMemo } from 'react';
import { Search, MapPin, Phone, Globe, MessageCircle, X, TrendingUp, Building2 } from 'lucide-react';
import leadsData from './data.json';
import './App.css';

function LeadCard({ lead }) {
  // Usa cleanPhone se disponível, senão limpa o phone normal
  const phoneForWhats = lead.cleanPhone
    ? lead.cleanPhone.replace(/\D/g, '')
    : (lead.phone || '').replace(/\D/g, '');

  const whatsappLink = phoneForWhats
    ? `https://wa.me/${phoneForWhats}?text=Olá!%20Somos%20uma%20agência%20digital%20e%20percebemos%20que%20o%20*${encodeURIComponent(lead.name)}*%20não%20possui%20site.%20Podemos%20te%20ajudar!`
    : '#';

  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    [lead.fullAddress, lead.city].filter(Boolean).join(', ')
  )}`;

  return (
    <div className="lead-card">
      <div className="card-header">
        <div className="card-header-left">
          <span className="category-tag">{lead.category || 'Comércio Local'}</span>
          <h3 className="card-title">{lead.name}</h3>
        </div>
        <div className="no-website-badge">
          <Globe size={12} />
          <span>Sem Site</span>
        </div>
      </div>

      <div className="card-content">
        {lead.phone && (
          <div className="info-row">
            <Phone className="info-icon" size={16} />
            <span>{lead.phone}</span>
          </div>
        )}
        <div className="info-row">
          <MapPin className="info-icon" size={16} />
          <span>
            {lead.fullAddress && <>{lead.fullAddress}<br /></>}
            <strong>{lead.city}</strong>
          </span>
        </div>
      </div>

      <div className="card-actions">
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className={`btn btn-whatsapp ${!phoneForWhats ? 'btn-disabled' : ''}`}
          title={!phoneForWhats ? 'Telefone não disponível' : 'Abrir WhatsApp'}
        >
          <MessageCircle size={18} />
          WhatsApp
        </a>
        <a
          href={mapsLink}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-maps"
        >
          <MapPin size={18} />
          Maps
        </a>
      </div>
    </div>
  );
}

function StatBadge({ icon, label, value }) {
  return (
    <div className="stat-badge">
      {icon}
      <div>
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
      </div>
    </div>
  );
}

function App() {
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchText, setSearchText] = useState('');

  // Dados dinâmicos extraídos do JSON
  const cities = useMemo(() => {
    const unique = [...new Set(leadsData.map(l => l.city).filter(Boolean))].sort();
    return unique;
  }, []);

  const categories = useMemo(() => {
    const unique = [...new Set(leadsData.map(l => l.category).filter(Boolean))].sort();
    return unique;
  }, []);

  // Filtros combinados
  const filteredLeads = useMemo(() => {
    return leadsData.filter(lead => {
      const matchCity = selectedCity ? lead.city === selectedCity : true;
      const matchCategory = selectedCategory ? lead.category === selectedCategory : true;
      const matchNoWebsite = !lead.website || lead.website.trim() === '';
      const matchSearch = searchText
        ? [lead.name, lead.city, lead.category, lead.fullAddress]
            .filter(Boolean)
            .some(field => field.toLowerCase().includes(searchText.toLowerCase()))
        : true;
      return matchCity && matchCategory && matchNoWebsite && matchSearch;
    });
  }, [selectedCity, selectedCategory, searchText]);

  const clearFilters = () => {
    setSelectedCity('');
    setSelectedCategory('');
    setSearchText('');
  };

  const hasFilters = selectedCity || selectedCategory || searchText;

  return (
    <div className="dashboard-container">
      <header className="header">
        <div>
          <h1>Painel de Oportunidades</h1>
          <p className="header-subtitle">
            Comércios e restaurantes brasileiros <strong>sem presença digital</strong> — prontos para contato
          </p>
        </div>
        <div className="header-stats">
          <StatBadge icon={<TrendingUp size={18} />} label="Total de Leads" value={leadsData.length} />
          <StatBadge icon={<Building2 size={18} />} label="Cidades" value={cities.length} />
        </div>
      </header>

      {/* Barra de busca */}
      <div className="search-bar-wrapper">
        <Search className="search-icon" size={18} />
        <input
          type="text"
          id="search-text"
          className="search-input"
          placeholder="Buscar por nome, cidade, categoria..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        {searchText && (
          <button className="clear-search" onClick={() => setSearchText('')}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="filters-bar">
        <div className="filter-group">
          <label htmlFor="city">Cidade</label>
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
          <label htmlFor="category">Categoria</label>
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

        <div className="filter-results">
          <span className="results-count">
            <Search size={14} />
            {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}
          </span>
          {hasFilters && (
            <button className="clear-filters-btn" onClick={clearFilters}>
              <X size={14} />
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Grid de leads */}
      {filteredLeads.length > 0 ? (
        <div className="leads-grid">
          {filteredLeads.map((lead, idx) => (
            <LeadCard key={lead.id || idx} lead={lead} />
          ))}
        </div>
      ) : (
        <div className="no-results">
          <Search size={48} style={{ opacity: 0.2, margin: '0 auto 1rem auto', display: 'block' }} />
          <h3>Nenhum lead encontrado</h3>
          <p>Tente ajustar os filtros ou aguarde o scraper trazer mais dados.</p>
          {hasFilters && (
            <button className="clear-filters-btn" style={{ margin: '1rem auto 0', display: 'flex' }} onClick={clearFilters}>
              <X size={14} />
              Limpar filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
