import MovieRow from '../components/MovieRow'

export default function HomePage() {
  return (
    <div className="pt-20">
      <MovieRow title="Trending Today" endpoint="tmdb/trending/movie/day" />
      <MovieRow title="Bollywood" endpoint="browse/bollywood" />
      <MovieRow title="Hollywood" endpoint="browse/hollywood" />
      <MovieRow title="Animation" endpoint="browse/animation" />
      <MovieRow title="Action" endpoint="browse/genre/28" />
      <MovieRow title="Comedy" endpoint="browse/genre/35" />
      <MovieRow title="Horror" endpoint="browse/genre/27" />
      <MovieRow title="Thriller" endpoint="browse/genre/53" />
    </div>
  )
}
