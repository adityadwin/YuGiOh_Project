import { Box, Image, Heading } from "@chakra-ui/react";
import { Link } from "react-router-dom";

function Card({ card }) {
  return (
    <Link key={card.id} to={`/card/${card.id}`}>
      <Box className="yugioh-card" bg="gray.100" borderRadius="lg" p="3">
        <Image
          src={card.card_images[0].image_url}
          alt={card.name}
          borderRadius="lg"
          width="100%"
        />
        <Heading as="h2" size="md" mt="2" mb="1">
          {card.name}
        </Heading>
        <Box display="flex" justifyContent="space-between">
          <Box>ATK: {card.atk}</Box>
          <Box>DEF: {card.def}</Box>
        </Box>
      </Box>
    </Link>
  );
}

export default Card;

