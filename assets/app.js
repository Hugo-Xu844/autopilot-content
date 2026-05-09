/* =============================================
   AI 编程实验室 v2 — 交互功能
   深色模式 / 阅读进度条 / 回到顶部 / 代码复制
   ============================================= */

(function() {
  'use strict';

  // === Dark Mode Toggle ===
  const themeToggle = document.getElementById('theme-toggle');
  const storedTheme = localStorage.getItem('theme');

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    if (themeToggle) {
      themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  }

  // Apply stored theme or system preference
  if (storedTheme) {
    setTheme(storedTheme);
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', function() {
      const current = document.documentElement.getAttribute('data-theme');
      setTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  // === Reading Progress Bar ===
  const progressBar = document.getElementById('reading-progress');
  if (progressBar) {
    window.addEventListener('scroll', function() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        const progress = Math.min((scrollTop / docHeight) * 100, 100);
        progressBar.style.width = progress + '%';
      }
    });
  }

  // === Back to Top ===
  const backToTop = document.getElementById('back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 300) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    });

    backToTop.addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // === Image lazy loading ===
  document.querySelectorAll('.post-content img').forEach(function(img) {
    if (!img.hasAttribute('loading')) {
      img.setAttribute('loading', 'lazy');
    }
  });

  // === Code Copy Button ===
  document.querySelectorAll('.post-content pre').forEach(function(pre) {
    // Create copy button
    var btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.setAttribute('aria-label', '复制代码');
    btn.innerHTML = '<span class="copy-icon">📋</span><span class="copy-text">复制</span>';
    
    // Append button to pre
    pre.style.position = 'relative';
    pre.appendChild(btn);

    // Add copy functionality
    btn.addEventListener('click', function() {
      var code = pre.querySelector('code');
      var text = code ? code.textContent : pre.textContent;
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function() {
          showCopied(btn);
        }).catch(function() {
          fallbackCopy(text, btn);
        });
      } else {
        fallbackCopy(text, btn);
      }
    });
  });

  function fallbackCopy(text, btn) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showCopied(btn);
    } catch(e) {
      alert('复制失败，请手动选择代码复制');
    }
    document.body.removeChild(textarea);
  }

  function showCopied(btn) {
    var textSpan = btn.querySelector('.copy-text');
    var iconSpan = btn.querySelector('.copy-icon');
    var originalText = textSpan.textContent;
    var originalIcon = iconSpan.innerHTML;
    
    iconSpan.innerHTML = '✅';
    textSpan.textContent = '已复制';
    btn.classList.add('copied');
    
    setTimeout(function() {
      iconSpan.innerHTML = originalIcon;
      textSpan.textContent = originalText;
      btn.classList.remove('copied');
    }, 2000);
  }

  // === Keyboard Shortcuts ===
  document.addEventListener('keydown', function(e) {
    // 't' or 'T' to toggle theme
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 't' || e.key === 'T') {
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        const current = document.documentElement.getAttribute('data-theme');
        setTheme(current === 'dark' ? 'light' : 'dark');
      }
    }
  });

  // === Scroll to anchor with offset ===
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        var headerHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 64;
        var targetPos = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 16;
        window.scrollTo({ top: targetPos, behavior: 'smooth' });
      }
    });
  });

  // === Smooth external link handling ===
  document.querySelectorAll('.post-content a[target="_blank"]').forEach(function(link) {
    if (!link.getAttribute('rel')) {
      link.setAttribute('rel', 'noopener noreferrer');
    }
  });

})();
