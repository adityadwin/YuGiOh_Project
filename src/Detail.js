import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Button, Image, Heading, Text, SimpleGrid } from '@chakra-ui/react';

function Detail() {
  const [cardData, setCardData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const { id } = useParams();

  useEffect(() => {
    fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${id}`)
      .then((response) => response.json())
      .then((data) => {
        setCardData(data.data[0]);
        setIsLoading(false);
      })
      .catch((error) => console.log(error));
  }, [id]);

  const handleBackClick = () => {
    window.history.back();
  };

  return (
    <>
      <Box p="5">
        <Button onClick={handleBackClick}>Back</Button>
      </Box>

      {isLoading ? (
        <Heading as="h1">Loading...</Heading>
      ) : (
        <>
        <SimpleGrid columns={[1, 2]}  pr={[50, 100]} pl={[50, 100]} spacing="40px" my="5">
        <Box mt="4" pr="5" >
            <Image src={cardData.card_images[0].image_url} alt={cardData.name} />
        </Box>
        <Box mt="4">
        <Heading as="h2">{cardData.name}</Heading>
            <Text>
              Level: {cardData.level} <br />
              Attribute: {cardData.attribute} <br />
              ATK/{cardData.atk} DEF/{cardData.def} <br />
              Type: [ {cardData.race} / {cardData.type} ] <br />
              Description: {cardData.desc}
            </Text>
        </Box>
        </SimpleGrid>
          {cardData.card_sets ? (  
              <Box mt="4" pr={[2, 70, 100]} pl={[2, 70,100]} pb="50">
              <Heading as="h3" textAlign="center" pb="5">Card Sets</Heading>
              <SimpleGrid columns={[2, 3, 6]}  pr={[0, 10, 10]} pl={[2, 10,10]} pb={[2, 2,2]}spacing="40px" my="5"bg="#E2E8F0">
              {cardData.card_sets.map((set) => (
                <Box key={set.set_code} mt="2">
                  <Text> Name: {set.set_name}</Text>
                  <Text> Code: {set.set_code}</Text>
                  <Text> Rarity: {set.set_rarity}</Text>
                  <Text> Price: {set.set_price}</Text>
                </Box>
              ))}
              </SimpleGrid>
            </Box>
            
          ) : null}
        </>
      )}
    </>
  );
}

export default Detail;
