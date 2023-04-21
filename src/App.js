import { Box, Heading, Center } from "@chakra-ui/react";
import { Routes, Route } from "react-router-dom";
import Home from "./Home";
import Detail from "./Detail";
import NotFound from "./NotFound";// TODO: answer here

const App = () => {
  const MyRouter = () => 
  <div>
    <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/card/:id">
          <Route index element={<Detail />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
  </div>; // TODO: replace this

  return (
    <div className="App">
      {/* Navbar */}
      <Box w="100vw" bg="#b25819" p={6}>
        <Center>
          <Heading as="h1" color="#e2ded5">
            Yugi-Oh Card Deck
          </Heading>
        </Center>
      </Box>

      {/* Route */}
      <MyRouter />
    </div>
  );
};

export default App;
