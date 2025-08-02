globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createComponent, m as maybeRenderHead, u as unescapeHTML, r as renderTemplate } from './astro/server_a_q7el7H.mjs';

const html$2 = "<p>Ray Dalio’s latest thoughts on the economic machine and debt cycles. Worth watching for his perspective on current monetary policy effectiveness.</p>\n<p>The 30-minute video covers:</p>\n<ul>\n<li>Short-term debt cycles vs long-term trends</li>\n<li>Current positioning in the debt super cycle</li>\n<li>Policy implications for central banks</li>\n</ul>\n<p>Particularly relevant given recent Fed communications and market positioning.</p>";

				const frontmatter$2 = {"id":"dalio-video","title":"Ray Dalio's Latest Economic Machine Analysis","author":"markets-team","authorName":"Markets Team","publishedAt":"2025-08-02T09:15:00.000Z","type":"video","tags":["Economics","Debt Cycles","Ray Dalio"],"featured":false,"reactions":{"insights":8,"comments":5,"shares":12},"videoEmbed":{"url":"https://www.youtube.com/watch?v=PHe0bXAIuk0","title":"Ray Dalio How The Economic Machine Works","thumbnail":"/media/dalio-thumb.jpg"}};
				const file$2 = "/home/bhuvanesh/markets-feeds/v2/content/ideas/dalio-video.md";
				const url$2 = undefined;
				function rawContent$2() {
					return "\nRay Dalio's latest thoughts on the economic machine and debt cycles. Worth watching for his perspective on current monetary policy effectiveness.\n\nThe 30-minute video covers:\n- Short-term debt cycles vs long-term trends\n- Current positioning in the debt super cycle\n- Policy implications for central banks\n\nParticularly relevant given recent Fed communications and market positioning.";
				}
				function compiledContent$2() {
					return html$2;
				}
				function getHeadings$2() {
					return [];
				}

				const Content$2 = createComponent((result, _props, slots) => {
					const { layout, ...content } = frontmatter$2;
					content.file = file$2;
					content.url = url$2;

					return renderTemplate`${maybeRenderHead()}${unescapeHTML(html$2)}`;
				});

const __vite_glob_0_0 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	Content: Content$2,
	compiledContent: compiledContent$2,
	default: Content$2,
	file: file$2,
	frontmatter: frontmatter$2,
	getHeadings: getHeadings$2,
	rawContent: rawContent$2,
	url: url$2
}, Symbol.toStringTag, { value: 'Module' }));

const html$1 = "<p>New BIS research examines how modern cross-border payment systems can enhance efficiency while maintaining financial stability.</p>\n<p>Key findings on settlement risks and liquidity management in real-time gross settlement systems. Particularly relevant for emerging market central banks considering infrastructure upgrades.</p>\n<p>The paper provides practical frameworks for assessing trade-offs between efficiency gains and systemic risk management.</p>";

				const frontmatter$1 = {"id":"link-preview","title":"Interesting Research on Cross-Border Payment Systems","author":"fintech-team","authorName":"FinTech Team","publishedAt":"2025-08-02T08:45:00.000Z","type":"link","tags":["Research","Payments","Financial Infrastructure"],"featured":false,"reactions":{"insights":3,"comments":1,"shares":2},"linkPreview":{"url":"https://www.bis.org/publ/work1082.htm","title":"Cross-border payment systems efficiency and financial stability","description":"BIS working paper examining modern cross-border payment systems","domain":"bis.org"}};
				const file$1 = "/home/bhuvanesh/markets-feeds/v2/content/ideas/link-preview.md";
				const url$1 = undefined;
				function rawContent$1() {
					return "\nNew BIS research examines how modern cross-border payment systems can enhance efficiency while maintaining financial stability.\n\nKey findings on settlement risks and liquidity management in real-time gross settlement systems. Particularly relevant for emerging market central banks considering infrastructure upgrades.\n\nThe paper provides practical frameworks for assessing trade-offs between efficiency gains and systemic risk management.";
				}
				function compiledContent$1() {
					return html$1;
				}
				function getHeadings$1() {
					return [];
				}

				const Content$1 = createComponent((result, _props, slots) => {
					const { layout, ...content } = frontmatter$1;
					content.file = file$1;
					content.url = url$1;

					return renderTemplate`${maybeRenderHead()}${unescapeHTML(html$1)}`;
				});

const __vite_glob_0_1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	Content: Content$1,
	compiledContent: compiledContent$1,
	default: Content$1,
	file: file$1,
	frontmatter: frontmatter$1,
	getHeadings: getHeadings$1,
	rawContent: rawContent$1,
	url: url$1
}, Symbol.toStringTag, { value: 'Module' }));

const html = "<p>The current monetary policy transmission mechanism shows interesting divergences from historical patterns. Worth monitoring how traditional rate channels interact with modern financial structures.</p>\n<p>Key observations:</p>\n<ul>\n<li>Credit markets responding differently than equity markets</li>\n<li>Regional variations in policy effectiveness</li>\n<li>Corporate balance sheet impacts vary by sector</li>\n</ul>\n<p>This suggests a more nuanced approach to rate policy may be needed going forward.</p>";

				const frontmatter = {"id":"sample-insight","title":"Fed Policy Effectiveness in Current Environment","author":"research-team","authorName":"Research Team","publishedAt":"2025-08-02T10:30:00.000Z","type":"text","tags":["Monetary Policy","Federal Reserve","Economic Analysis"],"featured":true,"reactions":{"insights":5,"comments":2,"shares":3}};
				const file = "/home/bhuvanesh/markets-feeds/v2/content/ideas/sample-insight.md";
				const url = undefined;
				function rawContent() {
					return "\nThe current monetary policy transmission mechanism shows interesting divergences from historical patterns. Worth monitoring how traditional rate channels interact with modern financial structures.\n\nKey observations:\n- Credit markets responding differently than equity markets\n- Regional variations in policy effectiveness \n- Corporate balance sheet impacts vary by sector\n\nThis suggests a more nuanced approach to rate policy may be needed going forward.";
				}
				function compiledContent() {
					return html;
				}
				function getHeadings() {
					return [];
				}

				const Content = createComponent((result, _props, slots) => {
					const { layout, ...content } = frontmatter;
					content.file = file;
					content.url = url;

					return renderTemplate`${maybeRenderHead()}${unescapeHTML(html)}`;
				});

const __vite_glob_0_2 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	Content,
	compiledContent,
	default: Content,
	file,
	frontmatter,
	getHeadings,
	rawContent,
	url
}, Symbol.toStringTag, { value: 'Module' }));

class IdeasLoader {
  static instance;
  posts = [];
  lastLoaded = 0;
  CACHE_TTL = 5 * 60 * 1e3;
  // 5 minutes
  static getInstance() {
    if (!this.instance) {
      this.instance = new IdeasLoader();
    }
    return this.instance;
  }
  async loadPosts() {
    const now = Date.now();
    if (this.posts.length > 0 && now - this.lastLoaded < this.CACHE_TTL) {
      return this.posts;
    }
    try {
      const modules = /* #__PURE__ */ Object.assign({"../../content/ideas/dalio-video.md": __vite_glob_0_0,"../../content/ideas/link-preview.md": __vite_glob_0_1,"../../content/ideas/sample-insight.md": __vite_glob_0_2});
      const posts = [];
      for (const [path, module] of Object.entries(modules)) {
        const postFile = module;
        if (postFile.frontmatter) {
          const post = this.transformToIdeaPost(postFile, path);
          posts.push(post);
        }
      }
      posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      this.posts = posts;
      this.lastLoaded = now;
      return posts;
    } catch (error) {
      console.error("Error loading ideas posts:", error);
      return [];
    }
  }
  async getPostBySlug(slug) {
    const posts = await this.loadPosts();
    return posts.find((post) => post.id === slug) || null;
  }
  async getFeaturedPosts() {
    const posts = await this.loadPosts();
    return posts.filter((post) => post.frontmatter?.featured === true);
  }
  async getPostsByAuthor(author) {
    const posts = await this.loadPosts();
    return posts.filter((post) => post.author === author);
  }
  async getPostsByTag(tag) {
    const posts = await this.loadPosts();
    return posts.filter((post) => post.tags.includes(tag));
  }
  async getPostsByType(type) {
    const posts = await this.loadPosts();
    return posts.filter((post) => post.type === type);
  }
  async searchPosts(query) {
    const posts = await this.loadPosts();
    const searchTerms = query.toLowerCase().split(" ");
    return posts.filter((post) => {
      const searchableContent = `${post.title} ${post.content} ${post.tags.join(" ")}`.toLowerCase();
      return searchTerms.some((term) => searchableContent.includes(term));
    });
  }
  async getPopularTags(limit = 10) {
    const posts = await this.loadPosts();
    const tagCounts = /* @__PURE__ */ new Map();
    for (const post of posts) {
      for (const tag of post.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }
    return Array.from(tagCounts.entries()).map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count).slice(0, limit);
  }
  paginate(posts, page, limit = 20) {
    const offset = (page - 1) * limit;
    const paginatedPosts = posts.slice(offset, offset + limit);
    const totalPages = Math.ceil(posts.length / limit);
    return {
      posts: paginatedPosts,
      page,
      totalPages,
      totalPosts: posts.length,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  }
  transformToIdeaPost(postFile, filePath) {
    const fm = postFile.frontmatter;
    const fileName = filePath.split("/").pop()?.replace(".md", "") || "";
    const post = {
      id: fm.id || fileName,
      author: fm.author || "research-team",
      authorName: fm.authorName || "Research Team",
      authorAvatar: fm.authorAvatar,
      content: postFile.content || "",
      title: fm.title || "",
      timestamp: this.formatTimestamp(fm.publishedAt || fm.createdAt),
      createdAt: new Date(fm.publishedAt || fm.createdAt || Date.now()),
      type: fm.type || "text",
      tags: Array.isArray(fm.tags) ? fm.tags : [],
      reactions: {
        insights: fm.reactions?.insights || 0,
        comments: fm.reactions?.comments || 0,
        shares: fm.reactions?.shares || 0
      },
      isEdited: fm.isEdited || false,
      editedAt: fm.editedAt ? new Date(fm.editedAt) : void 0,
      isPrivate: fm.isPrivate || false,
      team: fm.team,
      frontmatter: fm
    };
    if (fm.type === "link" && fm.linkUrl) {
      post.linkPreview = {
        url: fm.linkUrl,
        title: fm.linkTitle || "",
        description: fm.linkDescription || "",
        domain: fm.linkDomain || this.extractDomain(fm.linkUrl),
        image: fm.linkImage
      };
    }
    if (fm.type === "video" && fm.videoTitle) {
      post.videoEmbed = {
        title: fm.videoTitle,
        thumbnail: fm.videoThumbnail || "",
        duration: fm.videoDuration,
        platform: fm.videoPlatform || "youtube",
        videoId: this.extractVideoId(fm.videoUrl, fm.videoPlatform),
        embedUrl: fm.videoUrl
      };
    }
    if (fm.type === "tweet" && fm.tweetAuthor) {
      post.tweetEmbed = {
        author: fm.tweetAuthor,
        handle: fm.tweetHandle || "",
        content: fm.tweetContent || "",
        avatar: fm.tweetAvatar,
        tweetId: fm.tweetId,
        createdAt: fm.publishedAt
      };
    }
    if (fm.type === "image" && fm.imageUrl) {
      post.imageAttachment = {
        url: fm.imageUrl,
        alt: fm.imageAlt || "",
        caption: fm.imageCaption
      };
    }
    post.frontmatter = fm;
    return post;
  }
  formatTimestamp(dateString) {
    const date = new Date(dateString);
    const now = /* @__PURE__ */ new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1e3 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1e3 * 60));
      return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
  extractDomain(url) {
    try {
      const domain = new URL(url).hostname;
      return domain.replace("www.", "").toUpperCase();
    } catch {
      return "EXTERNAL LINK";
    }
  }
  extractVideoId(url, platform) {
    if (!url) return void 0;
    if (platform === "youtube") {
      const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
      return match?.[1];
    }
    if (platform === "vimeo") {
      const match = url.match(/vimeo\.com\/(\d+)/);
      return match?.[1];
    }
    return void 0;
  }
}
const ideasLoader = IdeasLoader.getInstance();

export { ideasLoader as i };
