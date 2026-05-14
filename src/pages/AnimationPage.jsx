import HeroSection from '../components/HeroSection'
import TopTrending from '../components/TopTrending'
import ProductionHouseRail from '../components/ProductionHouseRail'
import { useProductionHouses } from '../hooks/useProductionHouses'

export default function AnimationPage() {
  const { houses } = useProductionHouses('animation')
  return (
    <div>
      <HeroSection category="animation" />
      <TopTrending category="animation" title="ANIMATION TOP 10 TRENDING" />
      <div>
        {houses.map(house => (
          <ProductionHouseRail
            key={house.id}
            category="animation"
            companyId={house.id}
            name={house.name}
            logoUrl={house.logoUrl}
          />
        ))}
      </div>
    </div>
  )
}
