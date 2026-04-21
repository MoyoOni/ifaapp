import React from 'react';
import { Star, MapPin, DollarSign, ExternalLink } from 'lucide-react';
import { SearchResult } from '@/services/searchService';
import './SearchResultCard.css';

interface SearchResultCardProps {
  result: SearchResult;
  onClick?: () => void;
}

const SearchResultCard: React.FC<SearchResultCardProps> = ({ result, onClick }) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'babalawo':
        return '🧙';
      case 'temple':
        return '🏛️';
      case 'course':
        return '📚';
      case 'product':
        return '📦';
      case 'circle':
        return '👥';
      case 'event':
        return '📅';
      case 'guide':
        return '📖';
      default:
        return '✨';
    }
  };

  return (
    <div className="search-result-card" onClick={onClick}>
      {/* Image/Icon */}
      <div className="result-image">
        {result.imageUrl ? (
          <img src={result.imageUrl} alt={result.title} />
        ) : (
          <div className="result-icon">{getTypeIcon(result.type)}</div>
        )}
      </div>

      {/* Content */}
      <div className="result-content">
        <div className="result-header">
          <h4 className="result-title">{result.title}</h4>
          <span className="result-type">{result.type}</span>
        </div>

        {result.description && (
          <p className="result-description">{result.description}</p>
        )}

        {/* Metadata */}
        <div className="result-meta">
          {result.rating && (
            <span className="meta-item">
              <Star size={14} fill="currentColor" />
              {result.rating}
              {result.reviewCount && <span> ({result.reviewCount})</span>}
            </span>
          )}

          {result.location && (
            <span className="meta-item">
              <MapPin size={14} />
              {result.location}
            </span>
          )}

          {result.price !== undefined && (
            <span className="meta-item">
              <DollarSign size={14} />
              ₦{result.price.toLocaleString()}
            </span>
          )}

          {result.relevanceScore && (
            <span
              className="relevance-score"
              title={`Relevance: ${Math.round(result.relevanceScore)}%`}
            >
              {Math.round(result.relevanceScore)}%
            </span>
          )}
        </div>

        {/* Highlights */}
        {result.highlights.length > 0 && (
          <div className="result-highlights">
            {result.highlights.map((highlight, idx) => (
              <span key={idx} className="highlight">
                {highlight}
              </span>
            ))}
          </div>
        )}
      </div>

      <ExternalLink size={16} className="result-link-icon" />
    </div>
  );
};

export default SearchResultCard;
