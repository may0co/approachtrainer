import re
r=lambda p:open('src/'+p).read()
a=r('areas.js')
# drop duplicated URL / CAM_COLOR declarations from the extracted block
a=re.sub(r"  var CAM_COLOR = \{.*?\};\n","",a,flags=re.S)
a=re.sub(r"  var URL = \{.*?\n  \};\n","",a,flags=re.S)
js=a+r('program.js')+r('core.js')+r('views.js')+r('events.js')
t=r('index.tpl').replace('/*CSS*/',r('style.css')).replace('/*JS*/',js)
open('index.html','w').write(t)
m=re.search(r'<script>\n(\(function.*)</script>',t,re.S).group(1)
open('/tmp/app.js','w').write(m)
print(len(t))
