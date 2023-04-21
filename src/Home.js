import { useState, useEffect } from "react";
import { SimpleGrid, Heading, Box, Select } from "@chakra-ui/react";
import Cards from "./Cards";

function Home() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortType, setSortType] = useState("name");

  useEffect(() => {
    const fetchData = async () => {
      const result = await fetch(
        "https://db.ygoprodeck.com/api/v7/cardinfo.php?banlist=tcg&level=4"
      );
      const data = await result.json();
      setData(data.data);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const sortData = (type) => {
    setSortType(type);
  };

  const sortedData = data.sort((a, b) => {
    switch (sortType) {
      case "name":
        return a.name.localeCompare(b.name);
      case "atk":
        return a.atk - b.atk;
      case "def":
        return a.def - b.def;
      default:
        return a.name.localeCompare(b.name);
    }
  });

  return (
    <Box textAlign="center">
      <Heading as="h1" my="10">
        {isLoading ? "Loading..." : "Yugioh Cards"}
      </Heading>
      {!isLoading && (
        <Box my="5" pr={[70, 150, 220]} pl={[70, 150, 220]}>
          <Select
            name="sort"
            placeholder="Sort by"
            defaultValue="name"
            onChange={(e) => sortData(e.target.value)}
          >
            <option value="name">Name</option>
            <option value="atk">Attack</option>
            <option value="def">Defense</option>
          </Select>
        </Box>
      )}
      <SimpleGrid columns={[1, 2, 3]}  pr={[50, 100, 150]} pl={[50, 100, 150]} spacing="40px" my="5">
            {sortedData.map((card) => (
              <Cards key={card.id} card={card} />
            ))}
          </SimpleGrid>
    </Box>
  );
} 

export default Home;

