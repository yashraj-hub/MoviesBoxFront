import HeroSection from '../components/HeroSection'
import TopTrending from '../components/TopTrending'
import ProductionHouseRail from '../components/ProductionHouseRail'
import { useProductionHouses } from '../hooks/useProductionHouses'

export default function BollywoodPage() {
  const { houses } = useProductionHouses('bollywood')
  return (
    <div>
      <HeroSection category="bollywood" />
      <TopTrending category="bollywood" title="BOLLYWOOD TOP 10 TRENDING" />
      <div>
        {houses.map(house => (
          <ProductionHouseRail
            key={house.id}
            category="bollywood"
            companyId={house.id}
            name={house.name}
            logoUrl={house.logoUrl}
          />
        ))}
      </div>
    </div>
  )
}
