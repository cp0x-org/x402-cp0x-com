import uniswap from "@/assets/uniswap.svg";
import balancer from "@/assets/balancer.svg";
import spark from "@/assets/spark.svg";
import aave from "@/assets/aave.svg";
import sky from "@/assets/sky.svg";
import liquidity from "@/assets/liquity.svg";
import morpho from "@/assets/morpho.svg";
import ethena from "@/assets/ethena_symbol.svg";
import tornado from "@/assets/tornado.svg";
import wrap from "@/assets/wrap-logo.png";
import akash from "@/assets/akash-logo.svg";

export const tabs = [
	{ id: "all", label: "All" },
	{ id: "swap", label: "Swap" },
	{ id: "defi", label: "DeFi" },
	{ id: "privacy", label: "Privacy" },
	{ id: "ai", label: "AI" },
];

export const interfaces = [
	{
		name: "Wrap",
		link: "https://wrap.cp0x.com",
		logo: wrap,
		hideName: false,
		isNew: true,
		tags: ["swap"],
	},
	{
		name: "Akash",
		link: "https://akash.cp0x.com",
		logo: akash,
		hideName: false,
		isNew: true,
		tags: ["ai"],
	},
	{
		name: "Ethena",
		link: "https://ethena.cp0x.com",
		logo: ethena,
		hideName: false,
		isNew: false,
		tags: ["defi"],
	},
	{
		name: "Morpho",
		link: "https://morpho.cp0x.com",
		logo: morpho,
		hideName: false,
		isNew: false,
		tags: ["defi"],
	},
	{
		name: "Sky",
		link: "https://sky.cp0x.com",
		logo: sky,
		hideName: false,
		isNew: false,
		tags: ["defi"],
	},
	{
		name: "Uniswap",
		link: "https://uni.cp0x.com",
		logo: uniswap,
		tags: ["swap"],
	},
	{
		name: "Aave",
		link: "https://aave.cp0x.com",
		logo: aave,
		hideName: false,
		tags: ["defi"],
	},
	{
		name: "Balancer",
		link: "https://balancer.cp0x.com",
		logo: balancer,
		tags: ["defi"],
	},
	{
		name: "Spark",
		link: "https://spark.cp0x.com",
		logo: spark,
		hideName: false,
		tags: ["defi"],
	},
	{
		name: "Tornado",
		link: "https://tornado.cp0x.com",
		logo: tornado,
		hideName: false,
		isNew: false,
		tags: ["privacy"],
	},
	{
		name: "Tornado in TOR",
		link: "http://cpxtor3q3klwgvk722swah7jbvz3vsoqvye5skun6tarseayw5uvpayd.onion",
		logo: tornado,
		hideName: false,
		isNew: false,
		tags: ["privacy"],
	},
	{
		name: "Liquity",
		link: "https://liquity.cp0x.com/",
		logo: liquidity,
		hideName: false,
		tags: ["defi"],
	},
];
