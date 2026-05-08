document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('apiKey');
    const keywordInput = document.getElementById('keyword');
    const industryInput = document.getElementById('industry');
    const toneSelect = document.getElementById('tone');
    const languageSelect = document.getElementById('language');
    const generateBtn = document.getElementById('generateBtn');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const btnText = document.querySelector('.btn-text');
    const errorMessage = document.getElementById('errorMessage');
    const outputSection = document.getElementById('outputSection');
    const downloadBtn = document.getElementById('downloadBtn');

    // Output elements
    const titleOutput = document.getElementById('titleOutput');
    const titleCount = document.getElementById('titleCount');
    const metaOutput = document.getElementById('metaOutput');
    const metaCount = document.getElementById('metaCount');
    const targetAudience = document.getElementById('targetAudience');
    const searchIntent = document.getElementById('searchIntent');
    const wordCount = document.getElementById('wordCount');
    const lsiOutput = document.getElementById('lsiOutput');
    const outlineOutput = document.getElementById('outlineOutput');

    // Load saved API key
    const savedKey = localStorage.getItem('openai_api_key');
    if (savedKey) {
        apiKeyInput.value = savedKey;
    }

    // Save API key on change
    apiKeyInput.addEventListener('change', (e) => {
        localStorage.setItem('openai_api_key', e.target.value);
    });

    let currentData = null; // Store data for download

    generateBtn.addEventListener('click', async () => {
        // Validate inputs
        if (!apiKeyInput.value || !keywordInput.value || !industryInput.value) {
            showError("Please fill in all required fields (API Key, Keyword, Industry).");
            return;
        }

        // Hide errors, show loading
        errorMessage.classList.add('hidden');
        outputSection.classList.add('hidden');
        generateBtn.disabled = true;
        btnText.textContent = "Generating...";
        loadingSpinner.classList.remove('hidden');

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    keyword: keywordInput.value,
                    industry: industryInput.value,
                    tone: toneSelect.value,
                    language: languageSelect.value,
                    api_key: apiKeyInput.value
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Failed to generate content.");
            }

            currentData = data;
            populateOutputs(data);
            
            // Show outputs
            outputSection.classList.remove('hidden');
            // Scroll to output
            outputSection.scrollIntoView({ behavior: 'smooth' });

        } catch (error) {
            showError(error.message);
        } finally {
            // Restore button
            generateBtn.disabled = false;
            btnText.textContent = "Generate SEO Content";
            loadingSpinner.classList.add('hidden');
        }
    });

    function showError(msg) {
        errorMessage.textContent = msg;
        errorMessage.classList.remove('hidden');
    }

    function populateOutputs(data) {
        // SEO Title
        titleOutput.textContent = data.seo_title || "";
        updateCharCount(data.seo_title, 60, titleCount);

        // Meta Description
        metaOutput.textContent = data.meta_description || "";
        updateCharCount(data.meta_description, 155, metaCount);

        // Content Brief
        if (data.content_brief) {
            targetAudience.textContent = data.content_brief.target_audience || "";
            searchIntent.textContent = data.content_brief.search_intent || "";
            wordCount.textContent = data.content_brief.word_count || "";
        }

        // LSI Keywords
        lsiOutput.innerHTML = '';
        if (data.lsi_keywords && Array.isArray(data.lsi_keywords)) {
            data.lsi_keywords.forEach(kw => {
                const span = document.createElement('span');
                span.className = 'tag';
                span.textContent = kw;
                lsiOutput.appendChild(span);
            });
        }

        // Blog Outline
        outlineOutput.innerHTML = data.blog_outline || "";
    }

    function updateCharCount(text, limit, element) {
        const len = (text || "").length;
        element.textContent = `${len}/${limit} characters`;
        if (len > limit) {
            element.classList.add('limit-reached');
        } else {
            element.classList.remove('limit-reached');
        }
    }

    // Copy to clipboard
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const targetEl = document.getElementById(targetId);
            
            let textToCopy = '';
            if (targetId === 'lsiOutput') {
                textToCopy = Array.from(targetEl.children).map(span => span.textContent).join(', ');
            } else if (targetId === 'outlineOutput') {
                textToCopy = targetEl.innerText; // Get plain text from HTML
            } else {
                textToCopy = targetEl.innerText;
            }

            navigator.clipboard.writeText(textToCopy).then(() => {
                const originalIcon = btn.textContent;
                btn.textContent = '✅';
                setTimeout(() => {
                    btn.textContent = originalIcon;
                }, 2000);
            });
        });
    });

    // Download functionality
    downloadBtn.addEventListener('click', () => {
        if (!currentData) return;

        let content = `AI SEO Content Generator Results\n\n`;
        content += `Target Keyword: ${keywordInput.value}\n`;
        content += `Industry: ${industryInput.value}\n`;
        content += `Tone: ${toneSelect.value}\n`;
        content += `Language: ${languageSelect.value}\n\n`;
        content += `--- SEO TITLE ---\n${currentData.seo_title}\n\n`;
        content += `--- META DESCRIPTION ---\n${currentData.meta_description}\n\n`;
        content += `--- CONTENT BRIEF ---\n`;
        content += `Target Audience: ${currentData.content_brief?.target_audience}\n`;
        content += `Search Intent: ${currentData.content_brief?.search_intent}\n`;
        content += `Word Count: ${currentData.content_brief?.word_count}\n\n`;
        content += `--- LSI KEYWORDS ---\n${(currentData.lsi_keywords || []).join(', ')}\n\n`;
        
        // Strip HTML from outline for text file
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = currentData.blog_outline || "";
        content += `--- BLOG OUTLINE ---\n${tempDiv.innerText}\n`;

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SEO_Content_${keywordInput.value.replace(/\s+/g, '_')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
});
