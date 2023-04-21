import React from "react";
import {
  render,
  waitFor,
  screen,
} from "@testing-library/react";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";

jest.mock("@chakra-ui/react", () => {
  const actualChakra = jest.requireActual("@chakra-ui/react");
  const { SimpleGrid, Box, Heading, Text, Image } = actualChakra;

  return {
    ...actualChakra,
    SimpleGrid: ({ children, ...props }) => (
      <SimpleGrid className="test-simple-grid" {...props}>
        {children}
      </SimpleGrid>
    ),
    Box: ({ children, ...props }) => (
      <Box {...props} className={"test-box " + props.className}>
        {children}
      </Box>
    ),
    Heading: ({ children, ...props }) => (
      <Heading {...props} className={"test-heading " + props.className}>
        {children}
      </Heading>
    ),
    Text: ({ children, ...props }) => (
      <Text {...props} className={"test-text " + props.className}>
        {children}
      </Text>
    ),
    Image: ({ children, ...props }) => (
      <Image
        {...props}
        role="test-image"
        className={"test-image " + props.className}
      >
        {children}
      </Image>
    ),
  };
});

global.fetch = jest.fn();

global.alert = jest.fn();

const renderWithRouter = (ui, { route = "/" } = {}) => {
  window.history.pushState({}, "Test page", route);

  return {
    ...render(ui, { wrapper: BrowserRouter }),
  };
};

const keyCodes = {
  Escape: 27,
};
function patchKeyEvent(e) {
  Object.defineProperty(e, "keyCode", {
    get: () => keyCodes[e.code] ?? 0,
  });
}
beforeAll(() => {
  document.addEventListener("keydown", patchKeyEvent, { capture: true });
});

describe("path /", () => {
  beforeEach(() => {
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockedData),
      })
    );
  });

  it("shows Loading component", async () => {
    renderWithRouter(<App />)
    await waitFor(async () =>
      expect(await screen.findByText("Loading...")).toBeTruthy(),
    )
  })

  describe("Container UI", () => {
    it("should use SimpleGrid with `Cards` component as children", async () => {
      const { container } = renderWithRouter(<App />);
      await waitFor(() => screen.findByText("Armageddon Knight"));
      expect(
        container.querySelector(".test-simple-grid .test-box.yugioh-card")
      ).toBeTruthy();
    });
  });
  describe("Cards UI", () => {
    it("card titles should be rendered with Chakra UI Heading, as `h2`", async () => {
      const { container } = renderWithRouter(<App />);

      await waitFor(() => screen.findByText("Armageddon Knight"));

      const yugiohCards = container.querySelectorAll(
        ".yugioh-card h2.test-heading"
      );

      const cardTitles = Array.from(yugiohCards).map(
        (card) => card.textContent
      );

      expect(cardTitles).toEqual(mockedData.data.map((card) => card.name));
    });

    it("card images should be rendered with Chakra UI Image", async () => {
      const { container } = renderWithRouter(<App />);

      await waitFor(() => screen.findByText("Armageddon Knight"));

      const yugiohCards = container.querySelectorAll(
        ".yugioh-card .test-image"
      );

      const cardImages = Array.from(yugiohCards).map((card) => card.src);

      expect(cardImages).toEqual(
        mockedData.data.map((card) => card.card_images[0].image_url)
      );
    });

    it("card component (Box) should be wrapped with a link to the card details page", async () => {
      const { container } = renderWithRouter(<App />);

      await waitFor(() => screen.findByText("Armageddon Knight"));

      const yugiohCards = container.querySelectorAll(".yugioh-card");

      const cardLinks = Array.from(yugiohCards).map((card) => card.parentNode.href);

      expect(cardLinks).toEqual(
        mockedData.data.map((card) => `http://localhost/card/${card.id}`)
      );
    });
  });

  describe("sorting behavior", () => {
    describe("when sorted by attack", () => {
      it("should sort correctly", async () => {
        const { container } = renderWithRouter(<App />);
        await waitFor(() => screen.findByText("Armageddon Knight"));

        userEvent.selectOptions(
          container.querySelector("[name=sort]"),
          "Attack"
        );

        const yugiohCard = container.getElementsByClassName("yugioh-card");

        const cardTitles = Array.from(yugiohCard).map(
          (card) => card.querySelector("h2").textContent
        );

        await waitFor(() =>
          expect(cardTitles).toEqual(
            mockedData.data
              .sort((a, b) => a.atk - b.atk)
              .map((card) => card.name)
          )
        );
      });
    });

    describe("when sorted by name", () => {
      it("should sort correctly", async () => {
        const { container } = renderWithRouter(<App />);
        await waitFor(() => screen.findByText("Armageddon Knight"));

        userEvent.selectOptions(container.querySelector("[name=sort]"), "Name");

        const yugiohCard = container.getElementsByClassName("yugioh-card");

        const cardTitles = Array.from(yugiohCard).map(
          (card) => card.querySelector("h2").textContent
        );

        await waitFor(() =>
          expect(cardTitles).toEqual(
            mockedData.data
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((card) => card.name)
          )
        );
      });
    });

    describe("when sorted by defence", () => {
      it("should sort correctly", async () => {
        const { container } = renderWithRouter(<App />);
        await waitFor(() => screen.findByText("Armageddon Knight"));

        userEvent.selectOptions(
          container.querySelector("[name=sort]"),
          "Defence"
        );

        const yugiohCard = container.getElementsByClassName("yugioh-card");

        const cardTitles = Array.from(yugiohCard).map(
          (card) => card.querySelector("h2").textContent
        );

        await waitFor(() =>
          expect(cardTitles).toEqual(
            mockedData.data
              .sort((a, b) => a.def - b.def)
              .map((card) => card.name)
          )
        );
      });
    });
  });
});

describe("path /card/:id", () => {
  beforeEach(() => {
    const singleMockedData = { ...mockedData };
    singleMockedData.data = [singleMockedData.data[0]];
    global.fetch.mockImplementation(() =>
      Promise.resolve({
        json: () => Promise.resolve(singleMockedData),
      })
    );
  });

  afterEach(() => {
    global.fetch.mockClear();
  });

  it("show Loading component", async () => {
    renderWithRouter(<App />, { route: "/card/123" });
    await waitFor(async () =>
      expect(await screen.findByText("Loading...")).toBeTruthy()
    );
  });

  describe("should render card correctly", () => {
    it("Should show data correctly", async () => {
      const singleMockedData = { ...mockedData };
      singleMockedData.data = [singleMockedData.data[0]];
      const { container } = renderWithRouter(<App />, { route: "/card/123" });
      const data = singleMockedData.data[0];
      await waitFor(async () =>
        expect(
          await screen.findByText(singleMockedData.data[0].name)
        ).toBeTruthy()
      );
      expect(
        screen.getByText(`Level: ${data.level}`).classList.contains("test-text")
      ).toBeTruthy();
      expect(
        screen.getByText(`${data.attribute}`).classList.contains("test-text")
      ).toBeTruthy();
      expect(
        screen
          .getByText(`ATK/${data.atk} DEF/${data.def}`)
          .classList.contains("test-text")
      ).toBeTruthy();
      expect(
        screen
          .getByText(`[ ${data.type} / ${data.race} ]`)
          .classList.contains("test-text")
      ).toBeTruthy();
      screen.getByRole("test-image");
      expect(
        container.querySelector(
          `.test-image[src='${data.card_images[0].image_url}']`
        )
      ).toBeTruthy();
      const card_sets = data.card_sets;
      card_sets.forEach((card_set) => {
        const el = screen.getByText("Name: " + card_set.set_name).parentElement;
        const text_els = Array.from(el.querySelectorAll(".test-text"));
        const texts = text_els.map((e) => e.textContent);
        expect(texts).toContain("Name: " + card_set.set_name);
        expect(texts).toContain("Code: " + card_set.set_code);
        expect(texts).toContain("Rarity: " + card_set.set_rarity);
        expect(texts).toContain("Price: " + card_set.set_price);
      });
    });
  });
});

describe("when user access a bad route", () => {
  it("should show a 404 page", async () => {
    renderWithRouter(<App />, { route: "/bad-route" });
    await waitFor(() => screen.findByText("404 Page not found!"));
  });
});

const mockedData = {
  data: [
    {
      id: 28985331,
      name: "Armageddon Knight",
      type: "Effect Monster",
      desc: "When this card is Summoned: You can send 1 DARK monster from your Deck to the GY.",
      atk: 1400,
      def: 1200,
      level: 4,
      race: "Warrior",
      attribute: "DARK",
      card_sets: [
        {
          set_name: "Dark Saviors",
          set_code: "DASA-EN040",
          set_rarity: "Super Rare",
          set_rarity_code: "(SR)",
          set_price: "1.48",
        },
        {
          set_name: "Legendary Hero Decks",
          set_code: "LEHD-ENC06",
          set_rarity: "Common",
          set_rarity_code: "(C)",
          set_price: "1.41",
        },
        {
          set_name: "Pendulum Domination Structure Deck",
          set_code: "SDPD-EN018",
          set_rarity: "Common",
          set_rarity_code: "(C)",
          set_price: "1.53",
        },
        {
          set_name: "Phantom Darkness",
          set_code: "PTDN-EN021",
          set_rarity: "Super Rare",
          set_rarity_code: "(SR)",
          set_price: "4.19",
        },
        {
          set_name: "Structure Deck: Shaddoll Showdown",
          set_code: "SDSH-EN017",
          set_rarity: "Common",
          set_rarity_code: "(C)",
          set_price: "1.13",
        },
        {
          set_name: "The Secret Forces",
          set_code: "THSF-EN035",
          set_rarity: "Super Rare",
          set_rarity_code: "(SR)",
          set_price: "2.38",
        },
        {
          set_name: "Turbo Pack: Booster One",
          set_code: "TU01-EN011",
          set_rarity: "Rare",
          set_rarity_code: "(R)",
          set_price: "2",
        },
      ],
      banlist_info: {
        ban_tcg: "Limited",
        ban_ocg: "Limited",
      },
      card_images: [
        {
          id: 28985331,
          image_url: "https://images.ygoprodeck.com/images/cards/28985331.jpg",
          image_url_small:
            "https://images.ygoprodeck.com/images/cards_small/28985331.jpg",
        },
      ],
      card_prices: [
        {
          cardmarket_price: "0.06",
          tcgplayer_price: "0.12",
          ebay_price: "1.48",
          amazon_price: "1.00",
          coolstuffinc_price: "2.99",
        },
      ],
    },
    {
      id: 61901281,
      name: "Black Dragon Collapserpent",
      type: "Effect Monster",
      desc: 'Cannot be Normal Summoned/Set. Must be Special Summoned (from your hand) by banishing 1 LIGHT monster from your GY. You can only Special Summon "Black Dragon Collapserpent" once per turn this way. If this card is sent from the field to the GY: You can add 1 "White Dragon Wyverburster" from your Deck to your hand.',
      atk: 1800,
      def: 1700,
      level: 4,
      race: "Dragon",
      attribute: "DARK",
      card_sets: [
        {
          set_name: "2014 Mega-Tin Mega Pack",
          set_code: "MP14-EN185",
          set_rarity: "Common",
          set_rarity_code: "(C)",
          set_price: "1.3",
        },
        {
          set_name: "Astral Pack Six",
          set_code: "AP06-EN006",
          set_rarity: "Super Rare",
          set_rarity_code: "(SR)",
          set_price: "3.22",
        },
        {
          set_name: "Battles of Legend: Hero's Revenge",
          set_code: "BLHR-EN077",
          set_rarity: "Ultra Rare",
          set_rarity_code: "(UR)",
          set_price: "2.02",
        },
        {
          set_name: "Maximum Gold: El Dorado",
          set_code: "MGED-EN133",
          set_rarity: "Rare",
          set_rarity_code: "(R)",
          set_price: "1.04",
        },
        {
          set_name: "Rise of the True Dragons Structure Deck",
          set_code: "SR02-EN017",
          set_rarity: "Common",
          set_rarity_code: "(C)",
          set_price: "1.29",
        },
        {
          set_name: "Shadow Specters",
          set_code: "SHSP-EN096",
          set_rarity: "Common",
          set_rarity_code: "(C)",
          set_price: "1.44",
        },
        {
          set_name: "Structure Deck: Albaz Strike",
          set_code: "SDAZ-EN013",
          set_rarity: "Common",
          set_rarity_code: "(C)",
          set_price: "0.92",
        },
        {
          set_name: "Synchron Extreme Structure Deck",
          set_code: "SDSE-EN023",
          set_rarity: "Common",
          set_rarity_code: "(C)",
          set_price: "1.54",
        },
      ],
      banlist_info: {
        ban_tcg: "Limited",
      },
      card_images: [
        {
          id: 61901281,
          image_url: "https://images.ygoprodeck.com/images/cards/61901281.jpg",
          image_url_small:
            "https://images.ygoprodeck.com/images/cards_small/61901281.jpg",
        },
      ],
      card_prices: [
        {
          cardmarket_price: "0.04",
          tcgplayer_price: "0.07",
          ebay_price: "0.99",
          amazon_price: "1.50",
          coolstuffinc_price: "2.99",
        },
      ],
    },
    {
      id: 581014,
      name: "Daigusto Emeral",
      type: "XYZ Monster",
      desc: "2 Level 4 monsters\nOnce per turn: You can detach 1 material from this card, then activate 1 of these effects.\n● Target 3 monsters in your GY; shuffle all 3 into the Deck, then draw 1 card.\n● Target 1 non-Effect Monster in your GY; Special Summon that target.",
      atk: 1800,
      def: 800,
      level: 4,
      race: "Rock",
      attribute: "WIND",
      archetype: "Gusto",
      card_sets: [
        {
          set_name: "Battle Pack 3: Monster League",
          set_code: "BP03-EN122",
          set_rarity: "Shatterfoil Rare",
          set_rarity_code: "(SHR)",
          set_price: "3.8",
        },
        {
          set_name: "Duel Overload",
          set_code: "DUOV-EN081",
          set_rarity: "Ultra Rare",
          set_rarity_code: "(UR)",
          set_price: "2.28",
        },
        {
          set_name: "Duel Terminal 7a",
          set_code: "DT07-EN036",
          set_rarity: "Duel Terminal Ultra Parallel Rare",
          set_rarity_code: "(DUPR)",
          set_price: "40.29",
        },
        {
          set_name: "Hidden Arsenal 7: Knight of Stars",
          set_code: "HA07-EN020",
          set_rarity: "Secret Rare",
          set_rarity_code: "(ScR)",
          set_price: "10.75",
        },
        {
          set_name: "Premium Gold: Infinite Gold",
          set_code: "PGL3-EN065",
          set_rarity: "Gold Rare",
          set_rarity_code: "(GUR)",
          set_price: "3.45",
        },
      ],
      banlist_info: {
        ban_tcg: "Limited",
      },
      card_images: [
        {
          id: 581014,
          image_url: "https://images.ygoprodeck.com/images/cards/581014.jpg",
          image_url_small:
            "https://images.ygoprodeck.com/images/cards_small/581014.jpg",
        },
      ],
      card_prices: [
        {
          cardmarket_price: "0.40",
          tcgplayer_price: "0.74",
          ebay_price: "1.82",
          amazon_price: "0.79",
          coolstuffinc_price: "0.99",
        },
      ],
    },
    {
      id: 14536035,
      name: "Dark Grepher",
      type: "Effect Monster",
      desc: "You can Special Summon this card (from your hand) by discarding 1 Level 5 or higher DARK monster. Once per turn: You can discard 1 DARK monster; send 1 DARK monster from your Deck to the GY.",
      atk: 1700,
      def: 1600,
      level: 4,
      race: "Warrior",
      attribute: "DARK",
      archetype: "Grepher",
      card_sets: [
        {
          set_name: "Dark Saviors",
          set_code: "DASA-EN042",
          set_rarity: "Super Rare",
          set_rarity_code: "(SR)",
          set_price: "2.32",
        },
        {
          set_name: "Duel Terminal 6b",
          set_code: "DT06-EN058",
          set_rarity: "Duel Terminal Normal Parallel Rare",
          set_rarity_code: "(DNPR)",
          set_price: "3.41",
        },
        {
          set_name: "Legendary Collection 3: Yugi's World Mega Pack",
          set_code: "LCYW-EN208",
          set_rarity: "Common",
          set_rarity_code: "(C)",
          set_price: "1.96",
        },
        {
          set_name: "Pendulum Domination Structure Deck",
          set_code: "SDPD-EN017",
          set_rarity: "Common",
          set_rarity_code: "(C)",
          set_price: "1.75",
        },
        {
          set_name: "Phantom Darkness",
          set_code: "PTDN-EN000",
          set_rarity: "Secret Rare",
          set_rarity_code: "(ScR)",
          set_price: "61.89",
        },
        {
          set_name: "Phantom Darkness Sneak Peek Participation Card",
          set_code: "PTDN-ENSP1",
          set_rarity: "Super Rare",
          set_rarity_code: "(SR)",
          set_price: "9.57",
        },
        {
          set_name: "Turbo Pack: Booster Three",
          set_code: "TU03-EN001",
          set_rarity: "Ultra Rare",
          set_rarity_code: "(UR)",
          set_price: "29.46",
        },
      ],
      banlist_info: {
        ban_tcg: "Limited",
      },
      card_images: [
        {
          id: 14536035,
          image_url: "https://images.ygoprodeck.com/images/cards/14536035.jpg",
          image_url_small:
            "https://images.ygoprodeck.com/images/cards_small/14536035.jpg",
        },
      ],
      card_prices: [
        {
          cardmarket_price: "0.22",
          tcgplayer_price: "0.54",
          ebay_price: "1.85",
          amazon_price: "68.49",
          coolstuffinc_price: "0.79",
        },
      ],
    },
    {
      id: 51858306,
      name: "Eclipse Wyvern",
      type: "Effect Monster",
      desc: "If this card is sent to the Graveyard: Banish 1 Level 7 or higher LIGHT or DARK Dragon-Type monster from your Deck. If this card is banished from your Graveyard: You can add the monster banished by this card's effect to your hand.",
      atk: 1600,
      def: 1000,
      level: 4,
      race: "Dragon",
      attribute: "LIGHT",
      card_sets: [
        {
          set_name: "Dragons Collide Structure Deck",
          set_code: "SDDC-EN003",
          set_rarity: "Super Rare",
          set_rarity_code: "(SR)",
          set_price: "2.31",
        },
        {
          set_name: "Premium Gold",
          set_code: "PGLD-EN041",
          set_rarity: "Gold Rare",
          set_rarity_code: "(GUR)",
          set_price: "2.61",
        },
        {
          set_name: "Rise of the True Dragons Structure Deck",
          set_code: "SR02-EN015",
          set_rarity: "Common",
          set_rarity_code: "(C)",
          set_price: "1.61",
        },
      ],
      banlist_info: {
        ban_tcg: "Banned",
        ban_ocg: "Banned",
      },
      card_images: [
        {
          id: 51858306,
          image_url: "https://images.ygoprodeck.com/images/cards/51858306.jpg",
          image_url_small:
            "https://images.ygoprodeck.com/images/cards_small/51858306.jpg",
        },
      ],
      card_prices: [
        {
          cardmarket_price: "0.16",
          tcgplayer_price: "0.52",
          ebay_price: "0.99",
          amazon_price: "0.76",
          coolstuffinc_price: "0.99",
        },
      ],
    },
    {
      id: 17412721,
      name: "Elder Entity Norden",
      type: "Fusion Monster",
      desc: "1 Synchro or Xyz Monster + 1 Synchro or Xyz Monster\nWhen this card is Special Summoned: You can target 1 Level 4 or lower monster in your Graveyard; Special Summon it, but its effects are negated, also banish it when this card leaves the field.",
      atk: 2000,
      def: 2200,
      level: 4,
      race: "Fairy",
      attribute: "WATER",
      card_sets: [
        {
          set_name: "2015 Mega-Tins",
          set_code: "CT12-EN003",
          set_rarity: "Super Rare",
          set_rarity_code: "(SR)",
          set_price: "3.19",
        },
      ],
      banlist_info: {
        ban_tcg: "Banned",
        ban_ocg: "Banned",
      },
      card_images: [
        {
          id: 17412721,
          image_url: "https://images.ygoprodeck.com/images/cards/17412721.jpg",
          image_url_small:
            "https://images.ygoprodeck.com/images/cards_small/17412721.jpg",
        },
      ],
      card_prices: [
        {
          cardmarket_price: "1.34",
          tcgplayer_price: "0.98",
          ebay_price: "3.95",
          amazon_price: "1.85",
          coolstuffinc_price: "0.99",
        },
      ],
    },
    {
      id: 55623480,
      name: "Fairy Tail - Snow",
      type: "Effect Monster",
      desc: "If this card is Normal or Special Summoned: You can target 1 face-up monster your opponent controls; change it to face-down Defense Position. If this card is in your GY (Quick Effect): You can banish 7 other cards from your hand, field, and/or GY; Special Summon this card.",
      atk: 1850,
      def: 1000,
      level: 4,
      race: "Spellcaster",
      attribute: "LIGHT",
      card_sets: [
        {
          set_name: "2017 Mega-Tin Mega Pack",
          set_code: "MP17-EN091",
          set_rarity: "Common",
          set_rarity_code: "(C)",
          set_price: "5.84",
        },
        {
          set_name: "OTS Tournament Pack 19",
          set_code: "OP19-EN022",
          set_rarity: "Common",
          set_rarity_code: "(C)",
          set_price: "3.24",
        },
        {
          set_name: "OTS Tournament Pack 19 (POR)",
          set_code: "OP19-PT022",
          set_rarity: "Common",
          set_rarity_code: "(C)",
          set_price: "0",
        },
        {
          set_name: "OTS Tournament Pack 5",
          set_code: "OP05-EN005",
          set_rarity: "Super Rare",
          set_rarity_code: "(SR)",
          set_price: "17.7",
        },
        {
          set_name: "The Dark Illusion",
          set_code: "TDIL-EN042",
          set_rarity: "Short Print",
          set_rarity_code: "(SP)",
          set_price: "5.74",
        },
      ],
      banlist_info: {
        ban_tcg: "Banned",
      },
      card_images: [
        {
          id: 55623480,
          image_url: "https://images.ygoprodeck.com/images/cards/55623480.jpg",
          image_url_small:
            "https://images.ygoprodeck.com/images/cards_small/55623480.jpg",
        },
      ],
      card_prices: [
        {
          cardmarket_price: "0.45",
          tcgplayer_price: "0.41",
          ebay_price: "3.75",
          amazon_price: "9.32",
          coolstuffinc_price: "15.99",
        },
      ],
    },
    {
      id: 99177923,
      name: "Infernity Archfiend",
      type: "Effect Monster",
      desc: 'When you draw this card, if you have no other cards in your hand: You can reveal this card; Special Summon this card from your hand. When this card is Special Summoned: You can add 1 "Infernity" card from your Deck to your hand. You must have no cards in your hand to activate and to resolve this effect.',
      atk: 1800,
      def: 1200,
      level: 4,
      race: "Fiend",
      attribute: "DARK",
      archetype: "Archfiend",
      card_sets: [
        {
          set_name: "Duel Terminal 7",
          set_code: "DT07-EN060",
          set_rarity: "Duel Terminal Normal Parallel Rare",
          set_rarity_code: "(DNPR)",
          set_price: "0",
        },
        {
          set_name: "Duel Terminal 7b",
          set_code: "DT07-EN060",
          set_rarity: "Duel Terminal Rare Parallel Rare",
          set_rarity_code: "(DRPR)",
          set_price: "10.21",
        },
        {
          set_name: "Gold Series 3",
          set_code: "GLD3-EN027",
          set_rarity: "Gold Rare",
          set_rarity_code: "(GUR)",
          set_price: "9.58",
        },
        {
          set_name: "OTS Tournament Pack 2",
          set_code: "OP02-EN017",
          set_rarity: "Common",
          set_rarity_code: "(C)",
          set_price: "2.23",
        },
        {
          set_name:
            "Yu-Gi-Oh! 5D's World Championship 2009: Stardust Accelerator promotional cards",
          set_code: "WC09-EN001",
          set_rarity: "Super Rare",
          set_rarity_code: "(SR)",
          set_price: "38.63",
        },
        {
          set_name:
            "Yu-Gi-Oh! 5D's World Championship 2009: Stardust Accelerator promotional cards",
          set_code: "WC09-EN001",
          set_rarity: "Ultra Rare",
          set_rarity_code: "(UR)",
          set_price: "15.19",
        },
      ],
      banlist_info: {
        ban_tcg: "Limited",
      },
      card_images: [
        {
          id: 99177923,
          image_url: "https://images.ygoprodeck.com/images/cards/99177923.jpg",
          image_url_small:
            "https://images.ygoprodeck.com/images/cards_small/99177923.jpg",
        },
      ],
      card_prices: [
        {
          cardmarket_price: "0.38",
          tcgplayer_price: "1.47",
          ebay_price: "0.99",
          amazon_price: "3.77",
          coolstuffinc_price: "3.99",
        },
      ],
    },
    {
      id: 34086406,
      name: "Lavalval Chain",
      type: "XYZ Monster",
      desc: "2 Level 4 monsters\nOnce per turn: You can detach 1 Xyz Material from this card to activate 1 of these effects;\n● Send 1 card from your Deck to the Graveyard.\n● Choose 1 monster from your Deck and place it on top of your Deck.",
      atk: 1800,
      def: 1000,
      level: 4,
      race: "Sea Serpent",
      attribute: "FIRE",
      archetype: "Laval",
      card_sets: [
        {
          set_name: "Duel Terminal 7a",
          set_code: "DT07-EN035",
          set_rarity: "Duel Terminal Ultra Parallel Rare",
          set_rarity_code: "(DUPR)",
          set_price: "70.46",
        },
        {
          set_name: "Hidden Arsenal 7: Knight of Stars",
          set_code: "HA07-EN019",
          set_rarity: "Secret Rare",
          set_rarity_code: "(ScR)",
          set_price: "15.99",
        },
        {
          set_name: "Premium Gold: Return of the Bling",
          set_code: "PGL2-EN044",
          set_rarity: "Gold Rare",
          set_rarity_code: "(GUR)",
          set_price: "5.77",
        },
      ],
      banlist_info: {
        ban_tcg: "Banned",
        ban_ocg: "Banned",
      },
      card_images: [
        {
          id: 34086406,
          image_url: "https://images.ygoprodeck.com/images/cards/34086406.jpg",
          image_url_small:
            "https://images.ygoprodeck.com/images/cards_small/34086406.jpg",
        },
      ],
      card_prices: [
        {
          cardmarket_price: "3.02",
          tcgplayer_price: "3.56",
          ebay_price: "2.62",
          amazon_price: "6.03",
          coolstuffinc_price: "4.99",
        },
      ],
    },
    {
      id: 38572779,
      name: "Miscellaneousaurus",
      type: "Effect Monster",
      desc: "During either player's Main Phase: You can send this card from your hand to the Graveyard; during this Main Phase, Dinosaur-Type monsters you control are unaffected by your opponent's activated effects. You can banish any number of Dinosaur-Type monsters from your Graveyard, including this card; Special Summon 1 Dinosaur-Type monster from your Deck with a Level equal to the total number of monsters banished to activate this effect, but destroy it during the End Phase. You can only use this effect of \"Miscellaneousaurus\" once per turn.",
      atk: 1800,
      def: 1000,
      level: 4,
      race: "Dinosaur",
      attribute: "FIRE",
      card_sets: [
        {
          set_name: "2017 Mega-Tin Mega Pack",
          set_code: "MP17-EN193",
          set_rarity: "Common",
          set_rarity_code: "(C)",
          set_price: "1.28",
        },
        {
          set_name: "Dinosmasher's Fury Structure Deck",
          set_code: "SR04-EN014",
          set_rarity: "Common",
          set_rarity_code: "(C)",
          set_price: "1.88",
        },
        {
          set_name: "Maximum Gold",
          set_code: "MAGO-EN015",
          set_rarity: "Premium Gold Rare",
          set_rarity_code: "(PG)",
          set_price: "2.83",
        },
        {
          set_name: "Raging Tempest",
          set_code: "RATE-EN028",
          set_rarity: "Common",
          set_rarity_code: "(C)",
          set_price: "1.45",
        },
      ],
      banlist_info: {
        ban_tcg: "Limited",
      },
      card_images: [
        {
          id: 38572779,
          image_url: "https://images.ygoprodeck.com/images/cards/38572779.jpg",
          image_url_small:
            "https://images.ygoprodeck.com/images/cards_small/38572779.jpg",
        },
      ],
      card_prices: [
        {
          cardmarket_price: "0.17",
          tcgplayer_price: "0.39",
          ebay_price: "0.99",
          amazon_price: "0.49",
          coolstuffinc_price: "0.79",
        },
      ],
    },
    {
      id: 54719828,
      name: "Number 16: Shock Master",
      type: "XYZ Monster",
      desc: "3 Level 4 monsters\nOnce per turn: You can detach 1 Xyz Material from this card to declare 1 card type (Monster, Spell, or Trap); that type of card (if Spell or Trap) cannot be activated, or (if Monster) cannot activate its effects, until the end of your opponent's next turn.",
      atk: 2300,
      def: 1600,
      level: 4,
      race: "Fairy",
      attribute: "LIGHT",
      card_sets: [
        {
          set_name: "Collectible Tins 2012 Wave 2",
          set_code: "CT09-EN014",
          set_rarity: "Super Rare",
          set_rarity_code: "(SR)",
          set_price: "4.08",
        },
        {
          set_name:
            "Weekly Shonen Jump Alpha April 2012 membership promotional card",
          set_code: "JUMP-EN060",
          set_rarity: "Ultra Rare",
          set_rarity_code: "(UR)",
          set_price: "23.07",
        },
      ],
      banlist_info: {
        ban_tcg: "Banned",
        ban_ocg: "Banned",
      },
      card_images: [
        {
          id: 54719828,
          image_url: "https://images.ygoprodeck.com/images/cards/54719828.jpg",
          image_url_small:
            "https://images.ygoprodeck.com/images/cards_small/54719828.jpg",
        },
      ],
      card_prices: [
        {
          cardmarket_price: "3.88",
          tcgplayer_price: "1.27",
          ebay_price: "2.75",
          amazon_price: "2.38",
          coolstuffinc_price: "1.99",
        },
      ],
    },
    {
      id: 63504681,
      name: "Number 86: Heroic Champion - Rhongomyniad",
      type: "XYZ Monster",
      desc: "2 or more (max. 5) Level 4 Warrior monsters\nOnce per turn, during your opponent's End Phase: Detach 1 material from this card. This card gains effects based on the number of materials attached to it.\n● 1+: Cannot be destroyed by battle. ● 2+: Gains 1500 ATK/DEF. ● 3+: Unaffected by other cards' effects. ● 4+: Your opponent cannot Normal or Special Summon monsters. ● 5: Once per turn: You can destroy all cards your opponent controls.",
      atk: 1500,
      def: 1500,
      level: 4,
      race: "Warrior",
      attribute: "DARK",
      archetype: "Heroic",
      card_sets: [
        {
          set_name: "Legendary Hero Decks",
          set_code: "LEHD-ENC37",
          set_rarity: "Ultra Rare",
          set_rarity_code: "(UR)",
          set_price: "1.24",
        },
        {
          set_name: "World Superstars",
          set_code: "WSUP-EN022",
          set_rarity: "Prismatic Secret Rare",
          set_rarity_code: "(PScR)",
          set_price: "2.7",
        },
      ],
      banlist_info: {
        ban_tcg: "Banned",
      },
      card_images: [
        {
          id: 63504681,
          image_url: "https://images.ygoprodeck.com/images/cards/63504681.jpg",
          image_url_small:
            "https://images.ygoprodeck.com/images/cards_small/63504681.jpg",
        },
      ],
      card_prices: [
        {
          cardmarket_price: "0.29",
          tcgplayer_price: "0.48",
          ebay_price: "1.00",
          amazon_price: "1.49",
          coolstuffinc_price: "0.25",
        },
      ],
    },
    {
      id: 57835716,
      name: "Orcust Harp Horror",
      type: "Effect Monster",
      desc: 'You can banish this card from your GY; Special Summon 1 "Orcust" monster from your Deck, except "Orcust Harp Horror", also you cannot Special Summon monsters for the rest of this turn, except DARK monsters. You can only use this effect of "Orcust Harp Horror" once per turn.',
      atk: 1700,
      def: 1400,
      level: 4,
      race: "Machine",
      attribute: "DARK",
      archetype: "Orcust",
      card_sets: [
        {
          set_name: "OTS Tournament Pack 11",
          set_code: "OP11-EN007",
          set_rarity: "Super Rare",
          set_rarity_code: "(SR)",
          set_price: "5.91",
        },
        {
          set_name: "OTS Tournament Pack 11 (POR)",
          set_code: "OP11-PT007",
          set_rarity: "Super Rare",
          set_rarity_code: "(SR)",
          set_price: "0.00",
        },
        {
          set_name: "Soul Fusion",
          set_code: "SOFU-EN016",
          set_rarity: "Rare",
          set_rarity_code: "(R)",
          set_price: "1.67",
        },
      ],
      banlist_info: {
        ban_tcg: "Banned",
      },
      card_images: [
        {
          id: 57835716,
          image_url: "https://images.ygoprodeck.com/images/cards/57835716.jpg",
          image_url_small:
            "https://images.ygoprodeck.com/images/cards_small/57835716.jpg",
        },
      ],
      card_prices: [
        {
          cardmarket_price: "0.44",
          tcgplayer_price: "0.80",
          ebay_price: "5.75",
          amazon_price: "6.23",
          coolstuffinc_price: "4.99",
        },
      ],
    },
    {
      id: 7563579,
      name: "Performage Plushfire",
      type: "Pendulum Effect Monster",
      desc: '[ Pendulum Effect ]\r\nIf a "Performage" monster(s) you control is destroyed by battle or card effect: You can Special Summon this card from your Pendulum Zone, then take 500 damage. You can only use this effect of "Performage Plushfire" once per turn.\r\n----------------------------------------\r\n[ Monster Effect ]\r\nIf this card on the field is destroyed by battle or card effect: You can Special Summon 1 "Performage" monster from your hand or Deck, except "Performage Plushfire".',
      atk: 1000,
      def: 1000,
      level: 4,
      race: "Spellcaster",
      attribute: "FIRE",
      archetype: "Performage",
      scale: 5,
      card_sets: [
        {
          set_name: "Dimension of Chaos",
          set_code: "DOCS-EN016",
          set_rarity: "Common",
          set_rarity_code: "(C)",
          set_price: "1.2",
        },
      ],
      banlist_info: {
        ban_tcg: "Banned",
        ban_ocg: "Banned",
      },
      card_images: [
        {
          id: 7563579,
          image_url: "https://images.ygoprodeck.com/images/cards/7563579.jpg",
          image_url_small:
            "https://images.ygoprodeck.com/images/cards_small/7563579.jpg",
        },
      ],
      card_prices: [
        {
          cardmarket_price: "0.15",
          tcgplayer_price: "0.15",
          ebay_price: "1.75",
          amazon_price: "0.25",
          coolstuffinc_price: "0.49",
        },
      ],
    },
    {
      id: 12958919,
      name: "Phantom Skyblaster",
      type: "Effect Monster",
      desc: 'When this card is Normal or Flip Summoned: You can Special Summon any number of "Skyblaster Tokens" (Fiend/DARK/Level 4/ATK 500/DEF 500), up to the number of monsters you control. Once per turn, during your Standby Phase: You can inflict 300 damage to your opponent for each "Skyblaster" monster you control. "Skyblaster" monsters you control cannot declare an attack during the turn you activate this effect.',
      atk: 1100,
      def: 800,
      level: 4,
      race: "Fiend",
      attribute: "DARK",
      card_sets: [
        {
          set_name: "Duel Terminal 6b",
          set_code: "DT06-EN056",
          set_rarity: "Duel Terminal Normal Parallel Rare",
          set_rarity_code: "(DNPR)",
          set_price: "3.56",
        },
        {
          set_name: "Duelist Pack: Jesse Anderson",
          set_code: "DP07-EN007",
          set_rarity: "Ultra Rare",
          set_rarity_code: "(UR)",
          set_price: "3.2",
        },
        {
          set_name: "Egyptian God Deck: Slifer the Sky Dragon",
          set_code: "EGS1-EN010",
          set_rarity: "Common",
          set_rarity_code: "(C)",
          set_price: "1.37",
        },
        {
          set_name: "Legendary Collection 2: The Duel Academy Years Mega Pack",
          set_code: "LCGX-EN194",
          set_rarity: "Secret Rare",
          set_rarity_code: "(ScR)",
          set_price: "2.8",
        },
        {
          set_name: "OTS Tournament Pack 6",
          set_code: "OP06-EN021",
          set_rarity: "Common",
          set_rarity_code: "(C)",
          set_price: "1.13",
        },
        {
          set_name: "Structure Deck: Powercode Link",
          set_code: "SDPL-EN015",
          set_rarity: "Common",
          set_rarity_code: "(C)",
          set_price: "1.75",
        },
        {
          set_name: "Structure Deck: Sacred Beasts",
          set_code: "SDSA-EN007",
          set_rarity: "Common",
          set_rarity_code: "(C)",
          set_price: "1.06",
        },
      ],
      banlist_info: {
        ban_tcg: "Limited",
      },
      card_images: [
        {
          id: 12958919,
          image_url: "https://images.ygoprodeck.com/images/cards/12958919.jpg",
          image_url_small:
            "https://images.ygoprodeck.com/images/cards_small/12958919.jpg",
        },
      ],
      card_prices: [
        {
          cardmarket_price: "0.05",
          tcgplayer_price: "0.06",
          ebay_price: "0.99",
          amazon_price: "2.92",
          coolstuffinc_price: "0.25",
        },
      ],
    },
    {
      id: 18326736,
      name: "Tellarknight Ptolemaeus",
      type: "XYZ Monster",
      desc: '2 or more Level 4 monsters\nOnce per Chain, during either player\'s turn: You can detach 3 Xyz Materials from this card; Special Summon from your Extra Deck, 1 Xyz Monster that is 1 Rank higher than this card, except a "Number" monster, by using this face-up card you control as the Xyz Material. (This is treated as an Xyz Summon. Xyz Materials attached to this card also become Xyz Materials on the Summoned monster.) You can detach 7 Xyz Materials from this card; skip your opponent\'s next turn. During each player\'s End Phase: You can attach 1 "Stellarknight" card from your Extra Deck to this card as a face-up Xyz Material.',
      atk: 550,
      def: 2600,
      level: 4,
      race: "Warrior",
      attribute: "LIGHT",
      archetype: "Stellarknight",
      card_sets: [
        {
          set_name: "Crossed Souls",
          set_code: "CROS-EN050",
          set_rarity: "Ultimate Rare",
          set_rarity_code: "(UtR)",
          set_price: "16.81",
        },
        {
          set_name: "Crossed Souls",
          set_code: "CROS-EN050",
          set_rarity: "Ultra Rare",
          set_rarity_code: "(UR)",
          set_price: "5.59",
        },
      ],
      banlist_info: {
        ban_tcg: "Banned",
        ban_ocg: "Banned",
      },
      card_images: [
        {
          id: 18326736,
          image_url: "https://images.ygoprodeck.com/images/cards/18326736.jpg",
          image_url_small:
            "https://images.ygoprodeck.com/images/cards_small/18326736.jpg",
        },
      ],
      card_prices: [
        {
          cardmarket_price: "3.47",
          tcgplayer_price: "3.37",
          ebay_price: "7.99",
          amazon_price: "5.74",
          coolstuffinc_price: "0.00",
        },
      ],
    },
    {
      id: 99234526,
      name: "White Dragon Wyverburster",
      type: "Effect Monster",
      desc: 'Cannot be Normal Summoned/Set. Must be Special Summoned (from your hand) by banishing 1 DARK monster from your GY. You can only Special Summon "White Dragon Wyverburster" once per turn this way. If this card is sent from the field to the GY: You can add 1 "Black Dragon Collapserpent" from your Deck to your hand.',
      atk: 1700,
      def: 1800,
      level: 4,
      race: "Dragon",
      attribute: "LIGHT",
      card_sets: [
        {
          set_name: "2014 Mega-Tin Mega Pack",
          set_code: "MP14-EN184",
          set_rarity: "Common",
          set_rarity_code: "(C)",
          set_price: "1.65",
        },
        {
          set_name: "Astral Pack Six",
          set_code: "AP06-EN005",
          set_rarity: "Super Rare",
          set_rarity_code: "(SR)",
          set_price: "2.58",
        },
        {
          set_name: "Battles of Legend: Hero's Revenge",
          set_code: "BLHR-EN076",
          set_rarity: "Ultra Rare",
          set_rarity_code: "(UR)",
          set_price: "2.17",
        },
        {
          set_name: "Maximum Gold: El Dorado",
          set_code: "MGED-EN132",
          set_rarity: "Rare",
          set_rarity_code: "(R)",
          set_price: "1.02",
        },
        {
          set_name: "Rise of the True Dragons Structure Deck",
          set_code: "SR02-EN016",
          set_rarity: "Common",
          set_rarity_code: "(C)",
          set_price: "1.31",
        },
        {
          set_name: "Shadow Specters",
          set_code: "SHSP-EN093",
          set_rarity: "Common",
          set_rarity_code: "(C)",
          set_price: "1.37",
        },
        {
          set_name: "Structure Deck: Albaz Strike",
          set_code: "SDAZ-EN012",
          set_rarity: "Common",
          set_rarity_code: "(C)",
          set_price: "0.89",
        },
        {
          set_name: "Synchron Extreme Structure Deck",
          set_code: "SDSE-EN022",
          set_rarity: "Common",
          set_rarity_code: "(C)",
          set_price: "1.28",
        },
      ],
      banlist_info: {
        ban_tcg: "Limited",
      },
      card_images: [
        {
          id: 99234526,
          image_url: "https://images.ygoprodeck.com/images/cards/99234526.jpg",
          image_url_small:
            "https://images.ygoprodeck.com/images/cards_small/99234526.jpg",
        },
      ],
      card_prices: [
        {
          cardmarket_price: "0.06",
          tcgplayer_price: "0.08",
          ebay_price: "2.25",
          amazon_price: "0.79",
          coolstuffinc_price: "0.49",
        },
      ],
    },
    {
      id: 85115440,
      name: "Zoodiac Broadbull",
      type: "XYZ Monster",
      desc: '2 Level 4 monsters\nOnce per turn, you can also Xyz Summon "Zoodiac Broadbull" by using 1 "Zoodiac" monster you control with a different name as Xyz Material. (If you used an Xyz Monster, any Xyz Materials attached to it also become Xyz Materials on this card.) This card gains ATK and DEF equal to the ATK and DEF of all "Zoodiac" monsters attached to it as Materials. Once per turn: You can detach 1 Xyz Material from this card; add 1 Beast-Warrior-Type monster, that can be Normal Summoned/Set, from your Deck to your hand.',
      atk: 0,
      def: 0,
      level: 4,
      race: "Beast-Warrior",
      attribute: "EARTH",
      archetype: "Zoodiac",
      card_sets: [
        {
          set_name: "2017 Mega-Tin Mega Pack",
          set_code: "MP17-EN206",
          set_rarity: "Secret Rare",
          set_rarity_code: "(ScR)",
          set_price: "2.16",
        },
        {
          set_name: "Raging Tempest",
          set_code: "RATE-EN051",
          set_rarity: "Secret Rare",
          set_rarity_code: "(ScR)",
          set_price: "3.69",
        },
      ],
      banlist_info: {
        ban_tcg: "Banned",
        ban_ocg: "Banned",
      },
      card_images: [
        {
          id: 85115440,
          image_url: "https://images.ygoprodeck.com/images/cards/85115440.jpg",
          image_url_small:
            "https://images.ygoprodeck.com/images/cards_small/85115440.jpg",
        },
      ],
      card_prices: [
        {
          cardmarket_price: "1.60",
          tcgplayer_price: "0.90",
          ebay_price: "1.19",
          amazon_price: "1.64",
          coolstuffinc_price: "1.49",
        },
      ],
    },
    {
      id: 48905153,
      name: "Zoodiac Drident",
      type: "XYZ Monster",
      desc: '4 Level 4 monsters\r\nOnce per turn, you can also Xyz Summon "Zoodiac Drident" by using 1 "Zoodiac" monster you control with a different name as Xyz Material. (If you used an Xyz Monster, any Xyz Materials attached to it also become Xyz Materials on this card.) This card gains ATK and DEF equal to the ATK and DEF of all "Zoodiac" monsters attached to it as Materials. Once per turn, during either player\'s turn: You can detach 1 Xyz Material from this card, then target 1 face-up card on the field; destroy it.',
      atk: 0,
      def: 0,
      level: 4,
      race: "Beast-Warrior",
      attribute: "EARTH",
      archetype: "Zoodiac",
      card_sets: [
        {
          set_name: "2017 Mega-Tin Mega Pack",
          set_code: "MP17-EN208",
          set_rarity: "Secret Rare",
          set_rarity_code: "(ScR)",
          set_price: "3.42",
        },
        {
          set_name: "Maximum Gold",
          set_code: "MAGO-EN036",
          set_rarity: "Premium Gold Rare",
          set_rarity_code: "(PG)",
          set_price: "1.51",
        },
        {
          set_name: "Raging Tempest",
          set_code: "RATE-EN053",
          set_rarity: "Secret Rare",
          set_rarity_code: "(ScR)",
          set_price: "3.56",
        },
      ],
      banlist_info: {
        ban_tcg: "Banned",
        ban_ocg: "Banned",
      },
      card_images: [
        {
          id: 48905153,
          image_url: "https://images.ygoprodeck.com/images/cards/48905153.jpg",
          image_url_small:
            "https://images.ygoprodeck.com/images/cards_small/48905153.jpg",
        },
      ],
      card_prices: [
        {
          cardmarket_price: "0.40",
          tcgplayer_price: "0.22",
          ebay_price: "0.99",
          amazon_price: "0.99",
          coolstuffinc_price: "0.99",
        },
      ],
    },
    {
      id: 78872731,
      name: "Zoodiac Ratpier",
      type: "Effect Monster",
      desc: 'If this card is Normal Summoned: You can send 1 "Zoodiac" card from your Deck to the Graveyard. An Xyz Monster whose original Type is Beast-Warrior and has this card as Xyz Material gains this effect.\n● Once per turn: You can detach 1 Xyz Material from this card; Special Summon 1 "Zoodiac Ratpier" from your hand or Deck.',
      atk: 0,
      def: 0,
      level: 4,
      race: "Beast-Warrior",
      attribute: "EARTH",
      archetype: "Zoodiac",
      card_sets: [
        {
          set_name: "2017 Mega-Tin Mega Pack",
          set_code: "MP17-EN181",
          set_rarity: "Super Rare",
          set_rarity_code: "(SR)",
          set_price: "1.45",
        },
        {
          set_name: "Raging Tempest",
          set_code: "RATE-EN014",
          set_rarity: "Super Rare",
          set_rarity_code: "(SR)",
          set_price: "1.74",
        },
      ],
      banlist_info: {
        ban_tcg: "Limited",
        ban_ocg: "Limited",
      },
      card_images: [
        {
          id: 78872731,
          image_url: "https://images.ygoprodeck.com/images/cards/78872731.jpg",
          image_url_small:
            "https://images.ygoprodeck.com/images/cards_small/78872731.jpg",
        },
      ],
      card_prices: [
        {
          cardmarket_price: "0.30",
          tcgplayer_price: "0.46",
          ebay_price: "1.49",
          amazon_price: "0.70",
          coolstuffinc_price: "0.99",
        },
      ],
    },
  ],
};
