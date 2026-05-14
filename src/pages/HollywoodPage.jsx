import HeroSection from '../components/HeroSection'
import TopTrending from '../components/TopTrending'
import ProductionHouseRail from '../components/ProductionHouseRail'
import { useProductionHouses } from '../hooks/useProductionHouses'

export default function HollywoodPage() {
  const { houses } = useProductionHouses('hollywood')
  return (
    <div>
      <HeroSection category="hollywood" />
      <TopTrending category="hollywood" title="HOLLYWOOD TOP 10 TRENDING" />
      <div>
        {houses.map(house => (
          <ProductionHouseRail
            key={house.id}
            category="hollywood"
            companyId={house.id}
            name={house.name}
            logoUrl={house.logoUrl}
          />
        ))}
      </div>
    </div>
  )
}
