import { Box, IconButton, Link, Text } from "@chakra-ui/react";
import { FaHeart } from "react-icons/fa";

function Footer() {
  return (
    <Box textAlign="center" mt="10" bg="#DD6B20">
      <Text fontSize='sm'>Made With <Link href="https://www.instagram.com/adityadwn99_/" >
        <IconButton icon={<FaHeart />} size="xs" /> 
      </Link> by Aditya DwiN</Text> 
    </Box>
  );
}

export default Footer;
